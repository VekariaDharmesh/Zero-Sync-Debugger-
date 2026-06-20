import httpx
import uuid
from datetime import datetime
from config import PARCLE_API_KEY, PARCLE_BASE_URL
from memory.schemas import ErrorRecord, FixRecord, MemoryHit
from typing import List
from fastapi import APIRouter

router = APIRouter()

# In-memory storage fallback for local demo/development
LOCAL_MEMORIES = [
    {
        "id": "mem-1",
        "similarity_score": 0.89,
        "error_type": "TypeError",
        "message": "Cannot read properties of undefined (reading 'name')",
        "fix_summary": "Added null guard before accessing user properties after find() call",
        "patch_diff": "--- a/routes/users.js\n+++ b/routes/users.js\n@@ -40,3 +40,6 @@\n const user = db.users.find(u => u.id === id);\n-res.json({ name: user.name });\n+if (!user) return res.status(404).json({ error: 'User not found' });\n+res.json({ name: user.name });",
        "outcome": "success",
        "fixed_at": datetime.utcnow().isoformat()
    },
    {
        "id": "mem-2",
        "similarity_score": 0.92,
        "error_type": "RangeError",
        "message": "Division by zero produces Infinity",
        "fix_summary": "Added guard for zero denominator before division operation",
        "patch_diff": "--- a/services/pricing.js\n+++ b/services/pricing.js\n@@ -16,3 +16,4 @@\n function calculateFee(amount) {\n+  if (amount === 0) return 0;\n   return BASE_FEE / amount;\n }",
        "outcome": "success",
        "fixed_at": datetime.utcnow().isoformat()
    }
]

HEADERS = {
    "Authorization": f"Bearer {PARCLE_API_KEY}",
    "Content-Type": "application/json",
}

async def query_similar_bugs(error: ErrorRecord, top_k: int = 5) -> List[MemoryHit]:
    if not PARCLE_API_KEY:
        # Fallback simulated search
        hits = []
        for mem in LOCAL_MEMORIES:
            # Simple keyword matching for simulation
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
            # Fail gracefully, return local match as fallback
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

    if not PARCLE_API_KEY:
        mem_id = f"mem-{str(uuid.uuid4())[:8]}"
        LOCAL_MEMORIES.insert(0, {
            "id": mem_id,
            "similarity_score": 1.0,
            "error_type": fix.error_record.error_type,
            "message": fix.error_record.message,
            "fix_summary": fix.fix_summary,
            "patch_diff": fix.patch_diff,
            "outcome": fix.outcome,
            "fixed_at": datetime.utcnow().isoformat()
        })
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
            return response.json().get("id", str(uuid.uuid4()))
        except Exception:
            # Fallback
            mem_id = f"mem-{str(uuid.uuid4())[:8]}"
            return mem_id

@router.get("/recent")
async def get_recent_fixes():
    if not PARCLE_API_KEY:
        return {"results": LOCAL_MEMORIES}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{PARCLE_BASE_URL}/memory/list",
                headers=HEADERS,
                params={"namespace": "bug-fixes", "limit": 20},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
        except Exception:
            return {"results": LOCAL_MEMORIES}
