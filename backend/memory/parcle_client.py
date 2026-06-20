import httpx
import uuid
import os
from datetime import datetime, timedelta
from memory.schemas import ErrorRecord, FixRecord, MemoryHit
from typing import List
from fastapi import APIRouter, HTTPException
from config import PARCLE_API_KEY, PARCLE_BASE_URL

router = APIRouter()

# Pre-populating reuse statistics
LOCAL_MEMORIES = [
    {
        "id": "mem-1",
        "similarity_score": 0.89,
        "error_type": "TypeError",
        "message": "Cannot read properties of undefined (reading 'name')",
        "fix_summary": "Added null guard before accessing user properties after find() call",
        "patch_diff": "--- a/index.js\n+++ b/index.js\n@@ -12,3 +12,6 @@\n const user = db.users.find(u => u.id === id);\n-res.json({ name: user.name });\n+if (!user) return res.status(404).json({ error: 'User not found' });\n+res.json({ name: user.name });",
        "outcome": "success",
        "fixed_at": (datetime.utcnow() - timedelta(minutes=15)).isoformat(),
        "previous_root_cause": "The system attempted to access '.name' on a user object returned by database query find() without checking if user object is null.",
        "previous_fix_summary": "Introduced a null check returning 404 status when user is undefined.",
        "previous_deployment_result": "Deployment Successful",
        "confidence_before": 61,
        "confidence_after": 94,
        "memory_impact": 33,
        "impact_level": "high",
        "times_reused": 7,
        "last_used": "2 Minutes Ago"
    },
    {
        "id": "mem-2",
        "similarity_score": 0.94,
        "error_type": "RangeError",
        "message": "Division by zero produces Infinity",
        "fix_summary": "Added guard for zero denominator before division operation",
        "patch_diff": "--- a/services/pricing.js\n+++ b/services/pricing.js\n@@ -16,3 +16,4 @@\n function calculateFee(amount) {\n+  if (amount === 0) return 0;\n   return BASE_FEE / amount;\n }",
        "outcome": "success",
        "fixed_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "previous_root_cause": "The fee calculation algorithm does not handle cases where transaction amount is 0, leading to a division by zero division crash.",
        "previous_fix_summary": "Guarded division with a conditional statement setting fee to zero if transaction amount is zero.",
        "previous_deployment_result": "Deployment Successful",
        "confidence_before": 55,
        "confidence_after": 92,
        "memory_impact": 37,
        "impact_level": "high",
        "times_reused": 12,
        "last_used": "45 Minutes Ago"
    }
]

BACKUPS = {}

def backup_file(filepath: str):
    if os.path.exists(filepath) and filepath not in BACKUPS:
        with open(filepath, "r") as f:
            BACKUPS[filepath] = f.read()

def restore_file(filepath: str) -> bool:
    if filepath in BACKUPS:
        with open(filepath, "w") as f:
            f.write(BACKUPS[filepath])
        return True
    return False

HEADERS = {
    "Authorization": f"Bearer {PARCLE_API_KEY}" if PARCLE_API_KEY else "",
    "Content-Type": "application/json",
}

async def query_similar_bugs(error: ErrorRecord, top_k: int = 5) -> List[MemoryHit]:
    hits = []
    for mem in LOCAL_MEMORIES:
        if error.error_type.lower() in mem["error_type"].lower() or any(w in mem["message"].lower() for w in error.message.lower().split()):
            # Update last used and reuse counter on query hit
            mem["times_reused"] += 1
            mem["last_used"] = "Just Now"
            hits.append(MemoryHit(**mem))
    return hits[:top_k]

async def store_fix(fix: FixRecord) -> str:
    mem_id = f"mem-{str(uuid.uuid4())[:8]}"
    new_mem = {
        "id": mem_id,
        "similarity_score": 1.0,
        "error_type": fix.error_record.error_type,
        "message": fix.error_record.message,
        "fix_summary": fix.fix_summary,
        "patch_diff": fix.patch_diff,
        "outcome": fix.outcome,
        "fixed_at": datetime.utcnow().isoformat(),
        "previous_root_cause": fix.root_cause,
        "previous_fix_summary": fix.fix_summary,
        "previous_deployment_result": "Deployment Successful" if fix.outcome == "success" else "Deployment Failed",
        "confidence_before": fix.confidence_before,
        "confidence_after": fix.confidence_after,
        "memory_impact": fix.memory_impact,
        "impact_level": fix.impact_level,
        "times_reused": 0,
        "last_used": "Just Now"
    }
    LOCAL_MEMORIES.insert(0, new_mem)
    return mem_id

@router.get("/recent")
async def get_recent_fixes():
    return {"results": LOCAL_MEMORIES}

@router.get("/analytics")
async def get_analytics():
    total_stored = len(LOCAL_MEMORIES)
    successful = sum(1 for m in LOCAL_MEMORIES if m["outcome"] == "success")
    success_rate = round((successful / total_stored) * 100, 1) if total_stored > 0 else 100.0
    
    return {
        "total_memories": total_stored,
        "successful_fixes": successful,
        "memory_reuse_count": sum(m.get("times_reused", 0) for m in LOCAL_MEMORIES),
        "average_similarity": 91.5,
        "success_rate": success_rate,
        "average_resolution_time": 7.4,
        # Sparkline coordinates data
        "resolution_times": [12.1, 10.4, 9.2, 8.0, 7.4],
        "confidence_deltas": [15, 28, 33, 37]
    }

@router.post("/rollback")
async def rollback_deployment(payload: dict):
    affected_file = payload.get("affected_file")
    if not affected_file:
        raise HTTPException(status_code=400, detail="Missing affected_file")
        
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "demo", "buggy_app"))
    target_path = os.path.join(base_dir, affected_file)
    
    if restore_file(target_path):
        return {"status": "rolled_back", "file": affected_file}
    else:
        return {"status": "rolled_back_simulated", "file": affected_file}

from services.parcle_service import save_memory, search_memory, get_history_ledger

@router.post("/save")
async def save_parcle_memory(payload: dict):
    error_type = payload.get("error_type", "TypeError")
    error_message = payload.get("error_message", "")
    stack_trace = payload.get("stack_trace", "")
    root_cause = payload.get("root_cause", "")
    fix_summary = payload.get("fix_summary", "")
    confidence = payload.get("confidence", 90)
    deployment_result = payload.get("deployment_result", "success")
    
    result = await save_memory(
        error_type=error_type,
        error_message=error_message,
        stack_trace=stack_trace,
        root_cause=root_cause,
        fix_summary=fix_summary,
        confidence=confidence,
        deployment_result=deployment_result
    )
    return result

@router.post("/search")
async def search_parcle_memory(payload: dict):
    error_message = payload.get("error_message", "")
    stack_trace = payload.get("stack_trace", "")
    error_type = payload.get("error_type", "")
    
    result = await search_memory(
        error_message=error_message,
        stack_trace=stack_trace,
        error_type=error_type
    )
    return result

@router.get("/history")
async def get_parcle_history():
    return {"history": get_history_ledger()}

