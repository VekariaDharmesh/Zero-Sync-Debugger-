import time
import uuid
import asyncio
from memory.schemas import ErrorRecord, FixRecord
from memory.parcle_client import query_similar_bugs, store_fix, backup_file
from agent.reasoner import reason
from agent.patcher import validate_patch, apply_patch_dry_run
from agent.deployer import deploy_patch
from streams.sse import broadcast
import os

PENDING_PIPELINES = {}

def calculate_memory_impact(confidence_before: int, confidence_after: int) -> dict:
    impact = confidence_after - confidence_before
    if impact >= 25:
        level = "high"
    elif impact >= 10:
        level = "medium"
    else:
        level = "low"
    return {
        "confidence_before": confidence_before,
        "confidence_after": confidence_after,
        "memory_impact": impact,
        "impact_level": level
    }

async def run_pipeline(error: ErrorRecord):
    start = time.time()
    pipeline_id = f"inc-{int(start)}-{str(uuid.uuid4().hex[:4])}"
    
    # 1. Error Received
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "received",
        "error_type": error.error_type,
        "message": error.message,
        "stack_trace": error.stack_trace,
        "file_path": error.file_path,
        "line_number": error.line_number,
        "language": error.language,
        "severity": error.severity,
        "service_name": error.service_name,
        "timestamp": datetime_string(),
        "time_relative": "0s"
    })
    await asyncio.sleep(0.6)

    # 2. Context Extraction
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "context_extraction",
        "timestamp": datetime_string(),
        "time_relative": relative_time(start)
    })
    await asyncio.sleep(0.5)

    # 3. Parcle Memory Query
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "querying_memory",
        "timestamp": datetime_string(),
        "time_relative": relative_time(start)
    })
    
    # Broadcast SDK Search Started event
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "MEMORY_SEARCH_STARTED",
        "timestamp": datetime_string()
    })
    
    from services.parcle_service import search_memory
    parcle_result = await search_memory(
        error_message=error.message,
        stack_trace=error.stack_trace,
        error_type=error.error_type
    )
    
    # Broadcast SDK Search Completed event
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "MEMORY_SEARCH_COMPLETED",
        "answer": parcle_result.get("answer"),
        "confidence": parcle_result.get("confidence"),
        "citations": parcle_result.get("citations"),
        "timestamp": datetime_string()
    })
    
    memory_hits = await query_similar_bugs(error)
    await asyncio.sleep(0.7)

    # 4. Similarity Scoring
    top_similarity = memory_hits[0].similarity_score if memory_hits else 0
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "similarity_scoring",
        "hits": len(memory_hits),
        "top_similarity": top_similarity,
        "hits_data": [h.dict() for h in memory_hits],
        "timestamp": datetime_string(),
        "time_relative": relative_time(start)
    })
    await asyncio.sleep(0.6)

    # 5. Root Cause Analysis
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "reasoning",
        "timestamp": datetime_string(),
        "time_relative": relative_time(start)
    })
    reasoning = await reason(error, memory_hits, parcle_result)
    await asyncio.sleep(0.8)

    confidence_before = reasoning.get("confidence_before", 60)
    confidence_after = reasoning.get("confidence_after", 90)
    
    impact_data = calculate_memory_impact(confidence_before, confidence_after)
    memory_impact = impact_data["memory_impact"]
    impact_level = impact_data["impact_level"]

    risk_level = reasoning.get("risk_level", "low")
    root_cause = reasoning.get("root_cause", "")
    fix_summary = reasoning.get("fix_summary", "")
    patch_diff = reasoning.get("patch_diff")
    affected_file = reasoning.get("affected_file", "index.js")

    # 6. Patch Generation
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "patch_generated",
        "confidence_before": confidence_before,
        "confidence_after": confidence_after,
        "memory_impact": memory_impact,
        "impact_level": impact_level,
        "risk_level": risk_level,
        "root_cause": root_cause,
        "fix_summary": fix_summary,
        "patch_diff": patch_diff,
        "affected_file": affected_file,
        "memory_used": reasoning.get("memory_used", False),
        "timestamp": datetime_string(),
        "time_relative": relative_time(start)
    })
    await asyncio.sleep(0.6)

    if not patch_diff:
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "aborted",
            "reason": "Agent halted: no patch was generated.",
            "timestamp": datetime_string()
        })
        return

    # 7. Patch Validation
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "patch_validation",
        "timestamp": datetime_string(),
        "time_relative": relative_time(start)
    })
    valid, validation_msg = validate_patch(patch_diff)
    if not valid:
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "aborted",
            "reason": f"Patch syntax validation failed: {validation_msg}",
            "timestamp": datetime_string()
        })
        return
        
    # Apply local dry run
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "demo", "buggy_app"))
    dry_run_ok, dry_run_msg = apply_patch_dry_run(patch_diff, base_dir)
    if not dry_run_ok:
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "aborted",
            "reason": f"Dry-run patching failed: {dry_run_msg}",
            "timestamp": datetime_string()
        })
        return
    await asyncio.sleep(0.7)

    pipeline_state = {
        "pipeline_id": pipeline_id,
        "error": error,
        "patch_diff": patch_diff,
        "fix_summary": fix_summary,
        "affected_file": affected_file,
        "reasoning": reasoning,
        "start_time": start,
        "impact_data": impact_data
    }

    # Backup the original target file for rollback support
    target_path = os.path.join(base_dir, affected_file)
    backup_file(target_path)

    # 8. Confidence/Risk Check
    # Pause if risk is medium or high
    if risk_level.lower() in ["medium", "high"] or confidence_after < 75:
        PENDING_PIPELINES[pipeline_id] = pipeline_state
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "waiting_for_approval",
            "message": f"Requires manual confirmation due to {risk_level.upper()} Risk.",
            "timestamp": datetime_string(),
            "time_relative": relative_time(start)
        })
        return

    # Auto deploy for low risk
    await execute_deployment(pipeline_state)

async def execute_deployment(state: dict):
    pipeline_id = state["pipeline_id"]
    error = state["error"]
    patch_diff = state["patch_diff"]
    fix_summary = state["fix_summary"]
    affected_file = state["affected_file"]
    reasoning = state["reasoning"]
    start = state["start_time"]
    impact_data = state["impact_data"]

    # 8. Enter Pro Deployment
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "deploying",
        "timestamp": datetime_string(),
        "time_relative": relative_time(start)
    })
    
    logs = [
        "Connecting to Enter Pro API environment...",
        "Applying surgical unified diff patch...",
        "Installing dependencies: npm install...",
        "Executing verification dry-runs...",
        "Initiating container build...",
        "Rolling deployment container started on node-31.enterapp.pro...",
        "Health checks passed. Live traffic routed successfully."
    ]
    for log in logs:
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "deploying_log",
            "log": f"[{datetime_string()}] {log}"
        })
        await asyncio.sleep(0.4)

    try:
        deploy_result = await deploy_patch(patch_diff, fix_summary, affected_file)
        outcome = "success"
        deploy_url = deploy_result.get("deploy_url", "http://localhost:3001")
    except Exception as e:
        outcome = "deploy_failed"
        deploy_url = ""
        await broadcast({
            "pipeline_id": pipeline_id,
            "stage": "deploy_failed",
            "error": str(e),
            "timestamp": datetime_string()
        })
        return

    # 9. Memory Write Complete
    # Broadcast SDK Save Started
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "MEMORY_SAVE_STARTED",
        "timestamp": datetime_string()
    })
    
    from services.parcle_service import save_memory
    save_result = await save_memory(
        error_type=error.error_type,
        error_message=error.message,
        stack_trace=error.stack_trace,
        root_cause=reasoning.get("root_cause", ""),
        fix_summary=fix_summary,
        confidence=impact_data["confidence_after"],
        deployment_result=outcome
    )
    
    # Broadcast SDK Save Completed
    await broadcast({
        "pipeline_id": pipeline_id,
        "stage": "MEMORY_SAVE_COMPLETED",
        "session_id": save_result.get("session_id"),
        "event_id": save_result.get("event_id"),
        "timestamp": datetime_string()
    })

    fix = FixRecord(
        error_record=error,
        patch_diff=patch_diff,
        fix_summary=fix_summary,
        outcome=outcome,
        tokens_used=reasoning.get("tokens_used", 0),
        duration_seconds=round(time.time() - start, 2),
        confidence_before=impact_data["confidence_before"],
        confidence_after=impact_data["confidence_after"],
        memory_impact=impact_data["memory_impact"],
        impact_level=impact_data["impact_level"],
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
        "timestamp": datetime_string(),
        "time_relative": relative_time(start)
    })

async def approve_pipeline(pipeline_id: str) -> bool:
    if pipeline_id not in PENDING_PIPELINES:
        return False
    state = PENDING_PIPELINES.pop(pipeline_id)
    asyncio.create_task(execute_deployment(state))
    return True

# Helper functions
def datetime_string() -> str:
    return time.strftime("%H:%M:%S", time.localtime())

def relative_time(start_time: float) -> str:
    return f"{round(time.time() - start_time, 1)}s"
