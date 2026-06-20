import time
import uuid
import asyncio
from memory.schemas import ErrorRecord, FixRecord
from memory.parcle_client import query_similar_bugs, store_fix
from agent.reasoner import reason
from agent.patcher import validate_patch
from agent.deployer import deploy_patch
from streams.sse import broadcast

# Memory storage to hold pipelines waiting for manual approval
PENDING_PIPELINES = {}

async def run_pipeline(error: ErrorRecord):
    start = time.time()
    pipeline_id = f"{error.error_type}-{int(start)}"

    # Capture state of past fixes for deploy history calculation
    memory_hits = await query_similar_bugs(error)

    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "received",
        "error_type": error.error_type,
        "message": error.message,
        "stack_trace": error.stack_trace,
        "file_path": error.file_path,
        "line_number": error.line_number,
        "language": error.language,
        "received_at": error.received_at.isoformat()
    })

    await broadcast({"pipeline_id": pipeline_id, "stage": "querying_memory"})
    await asyncio.sleep(0.8) # visual pacing

    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "memory_results",
        "hits": len(memory_hits),
        "top_similarity": memory_hits[0].similarity_score if memory_hits else 0,
        "hits_data": [h.dict() for h in memory_hits]
    })

    await broadcast({"pipeline_id": pipeline_id, "stage": "reasoning"})
    reasoning = await reason(error, memory_hits)
    await asyncio.sleep(0.8) # visual pacing

    patch_diff = reasoning.get("patch_diff")
    confidence = reasoning.get("confidence", "high")
    root_cause = reasoning.get("root_cause")
    fix_summary = reasoning.get("fix_summary")
    affected_file = reasoning.get("affected_file", "unknown")

    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "patch_generated",
        "confidence": confidence,
        "root_cause": root_cause,
        "fix_summary": fix_summary,
        "patch_diff": patch_diff,
        "memory_used": reasoning.get("memory_used", False),
        "affected_file": affected_file
    })

    if not patch_diff:
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "aborted",
            "reason": "Agent returned low confidence — no patch generated",
        })
        return

    valid, validation_msg = validate_patch(patch_diff)
    if not valid:
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "aborted",
            "reason": f"Patch validation failed: {validation_msg}",
        })
        return

    pipeline_state = {
        "pipeline_id": pipeline_id,
        "error": error,
        "patch_diff": patch_diff,
        "fix_summary": fix_summary,
        "affected_file": affected_file,
        "reasoning": reasoning,
        "start_time": start
    }

    # Interactive Patch Preview before deploy:
    # If confidence is medium or low, pause pipeline and await explicit confirm request.
    if confidence.lower() in ["medium", "low"]:
        PENDING_PIPELINES[pipeline_id] = pipeline_state
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "waiting_for_approval",
            "message": "Manual approval required due to confidence score."
        })
        return

    # Auto-deploy for high confidence patches
    await execute_deployment(pipeline_state)

async def execute_deployment(state: dict):
    pipeline_id = state["pipeline_id"]
    error = state["error"]
    patch_diff = state["patch_diff"]
    fix_summary = state["fix_summary"]
    affected_file = state["affected_file"]
    reasoning = state["reasoning"]
    start = state["start_time"]

    await broadcast({"pipeline_id": pipeline_id, "stage": "deploying"})
    await asyncio.sleep(1.0) # Visual pacing for demo stability
    
    try:
        deploy_result = await deploy_patch(
            patch_diff,
            fix_summary,
            affected_file,
        )
        outcome = "success"
        deploy_url = deploy_result.get("deploy_url", "http://localhost:3001")
    except Exception as e:
        outcome = "deploy_failed"
        deploy_url = ""
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "deploy_failed",
            "error": str(e),
        })

    fix = FixRecord(
        error_record=error,
        patch_diff=patch_diff,
        fix_summary=fix_summary,
        outcome=outcome,
        tokens_used=reasoning.get("tokens_used", 0),
        duration_seconds=round(time.time() - start, 2),
        confidence=reasoning.get("confidence", "high"),
        root_cause=reasoning.get("root_cause", "")
    )
    
    memory_id = await store_fix(fix)

    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "complete",
        "outcome": outcome,
        "deploy_url": deploy_url,
        "memory_id": memory_id,
        "duration_seconds": fix.duration_seconds,
        "tokens_used": fix.tokens_used,
    })

async def approve_pipeline(pipeline_id: str) -> bool:
    if pipeline_id not in PENDING_PIPELINES:
        return False
    state = PENDING_PIPELINES.pop(pipeline_id)
    # Resume deployment asynchronously
    asyncio.create_task(execute_deployment(state))
    return True
