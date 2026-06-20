import httpx
import uuid
import os
import shutil
from datetime import datetime
from config import PARCLE_API_KEY, PARCLE_BASE_URL
from memory.schemas import ErrorRecord, FixRecord, MemoryHit
from typing import List
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Expanded Local Memories database for richer UI information
LOCAL_MEMORIES = [
    {
        "id": "mem-1",
        "similarity_score": 0.89,
        "error_type": "TypeError",
        "message": "Cannot read properties of undefined (reading 'name')",
        "fix_summary": "Added null guard before accessing user properties after find() call",
        "patch_diff": "--- a/index.js\n+++ b/index.js\n@@ -10,3 +10,6 @@\n const user = db.users.find(u => u.id === id);\n-res.json({ name: user.name });\n+if (!user) return res.status(404).json({ error: 'User not found' });\n+res.json({ name: user.name });",
        "outcome": "success",
        "fixed_at": datetime.utcnow().isoformat(),
        "previous_root_cause": "The system attempted to access '.name' on a user object returned by database query find() without confirming if any matching record exists.",
        "previous_fix_summary": "Introduced a null check returning 404 status when user is undefined.",
        "previous_deployment_result": "Deployment Successful"
    },
    {
        "id": "mem-2",
        "similarity_score": 0.94,
        "error_type": "RangeError",
        "message": "Division by zero produces Infinity",
        "fix_summary": "Added guard for zero denominator before division operation",
        "patch_diff": "--- a/services/pricing.js\n+++ b/services/pricing.js\n@@ -16,3 +16,4 @@\n function calculateFee(amount) {\n+  if (amount === 0) return 0;\n   return BASE_FEE / amount;\n }",
        "outcome": "success",
        "fixed_at": datetime.utcnow().isoformat(),
        "previous_root_cause": "The fee calculation algorithm does not handle cases where the transaction amount is 0, leading to a division by zero division crash.",
        "previous_fix_summary": "Guarded division with a conditional statement setting fee to zero if transaction amount is zero.",
        "previous_deployment_result": "Deployment Successful"
    }
]

# Track modifications for rollback purposes
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
    "Authorization": f"Bearer {PARCLE_API_KEY}",
    "Content-Type": "application/json",
}

async def query_similar_bugs(error: ErrorRecord, top_k: int = 5) -> List[MemoryHit]:
    if not PARCLE_API_KEY:
        hits = []
        for mem in LOCAL_MEMORIES:
            if error.error_type.lower() in mem["error_type"].lower() or any(w in mem["message"].lower() for w in error.message.lower().split()):
                hits.append(MemoryHit(**mem))
        return hits[:top_k]

    query_text = f"{error.error_type}: {error.message}\n\nStack:\n{error.stack_trace}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{PARCLE_BASE_URL}/memory/query",
                headers=HEADERS,
                json={"query": query_text, "top_k": top_k, "namespace": "bug-fixes"},
                timeout=10.0
            )
            response.raise_for_status()
            hits = response.json().get("results", [])
            return [MemoryHit(**h) for h in hits]
        except Exception:
            return [MemoryHit(**mem) for mem in LOCAL_MEMORIES if error.error_type.lower() in mem["error_type"].lower()]

async def store_fix(fix: FixRecord) -> str:
    content = (
        f"ERROR TYPE: {fix.error_record.error_type}\n"
        f"MESSAGE: {fix.error_record.message}\n"
        f"FILE: {fix.error_record.file_path}\n"
        f"FIX SUMMARY: {fix.fix_summary}\n"
        f"PATCH:\n{fix.patch_diff}\n"
        f"OUTCOME: {fix.outcome}"
    )

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
        "previous_deployment_result": "Deployment Successful" if fix.outcome == "success" else "Deployment Failed"
    }
    LOCAL_MEMORIES.insert(0, new_mem)

    if not PARCLE_API_KEY:
        return mem_id

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{PARCLE_BASE_URL}/memory/store",
                headers=HEADERS,
                json={
                    "content": content,
                    "namespace": "bug-fixes",
                    "metadata": {
                        "error_type": fix.error_record.error_type,
                        "outcome": fix.outcome,
                        "file_path": fix.error_record.file_path,
                    },
                },
                timeout=10.0
            )
            response.raise_for_status()
            return response.json().get("id", mem_id)
        except Exception:
            return mem_id

@router.get("/recent")
async def get_recent_fixes():
    return {"results": LOCAL_MEMORIES}

@router.get("/analytics")
async def get_analytics():
    total_stored = len(LOCAL_MEMORIES)
    successful = sum(1 for m in LOCAL_MEMORIES if m["outcome"] == "success")
    success_rate = round((successful / total_stored) * 100, 1) if total_stored > 0 else 100.0
    
    # Calculate some mock values showing evolution metrics
    return {
        "total_memories": total_stored,
        "successful_fixes": successful,
        "memory_reuse_count": max(1, total_stored - 2),
        "average_similarity": 91.5,
        "success_rate": success_rate,
        "average_resolution_time": 7.4
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
        # Fallback simulation
        return {"status": "rolled_back_simulated", "file": affected_file}
