import json
import anthropic
from config import ANTHROPIC_API_KEY
from memory.schemas import ErrorRecord, MemoryHit
from typing import List

SYSTEM_PROMPT = """You are Zero-Sync, an autonomous debugging agent with access to a persistent memory of past bug fixes.

Your job:
1. Analyze the incoming error — type, message, stack trace, file context
2. Review any similar past bugs retrieved from memory
3. Identify the root cause and explain it in plain language, explaining how memory influenced this fix
4. Generate a precise, minimal patch that fixes the issue without introducing new problems
5. Provide a confidence score (integer percentage 0-100) and risk assessment ("low", "medium", or "high")
6. Write a clear one-sentence summary of the fix

Output format — return only valid JSON, no markdown fences, no explanation outside the JSON:
{
  "root_cause": "detailed paragraph explaining why this error occurs, citing mitigation patterns",
  "confidence_score": 94,
  "risk_level": "low" | "medium" | "high",
  "fix_summary": "one sentence describing what the patch does",
  "patch_diff": "unified diff format patch string",
  "affected_file": "path/to/file.ext",
  "memory_used": true | false
}

Rules:
- Never output placeholder code. If you cannot produce a real patch, set patch_diff to null.
- Patches must be in unified diff format (--- a/file, +++ b/file, @@ ... @@).
- Do not add comments in the patch that explain what you changed. The diff is self-documenting.
- Be surgical. Change only what is broken."""

MOCK_RESPONSES = {
    "TypeError": {
        "root_cause": "The current incident appears similar to two historical memory entries. The root cause is an unchecked user lookup returning null. A previous successful fix introduced a null guard before property access. The generated patch follows the same mitigation pattern.",
        "confidence_score": 94,
        "risk_level": "low",
        "fix_summary": "Added a null check guard returning 404 status when user is not found.",
        "affected_file": "index.js",
        "memory_used": True,
        "patch_diff": """--- a/index.js
+++ b/index.js
@@ -12,3 +12,4 @@
 app.get("/user/:id", (req, res) => {
   const user = db.users.find((u) => u.id === parseInt(req.params.id));
+  if (!user) return res.status(404).json({ error: "User not found" });
   res.json({ name: user.name, balance: user.balance });
 });"""
    },
    "RangeError": {
        "root_cause": "The incident matches a past RangeError in services/pricing.js. The current code calculates a fee by dividing by transaction amount without safeguarding for division-by-zero. The patch inserts a conditional guard matching prior incident responses.",
        "confidence_score": 92,
        "risk_level": "low",
        "fix_summary": "Added a check to ensure transfer amount is greater than zero to prevent division by zero.",
        "affected_file": "index.js",
        "memory_used": True,
        "patch_diff": """--- a/index.js
+++ b/index.js
@@ -20,3 +20,4 @@
   const receiver = db.users.find((u) => u.id === to_id);
+  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
   const fee = 10 / amount;
   sender.balance -= amount + fee;"""
    },
    "UndefinedReceiver": {
        "root_cause": "The transfer algorithm executes state updates on sender/receiver database records before verifying if they exist. Based on past memories, this triggers undefined property access crashes. A manual approval review is recommended as the patch has moderate complexity.",
        "confidence_score": 63,
        "risk_level": "medium",
        "fix_summary": "Added check to ensure both sender and receiver exist before updating balances.",
        "affected_file": "index.js",
        "memory_used": True,
        "patch_diff": """--- a/index.js
+++ b/index.js
@@ -21,3 +21,5 @@
   const receiver = db.users.find((u) => u.id === to_id);
+  if (!sender) return res.status(404).json({ error: "Sender not found" });
+  if (!receiver) return res.status(404).json({ error: "Receiver not found" });
   const fee = 10 / amount;"""
    }
}

async def reason(error: ErrorRecord, memory_hits: List[MemoryHit]) -> dict:
    if not ANTHROPIC_API_KEY:
        # Fallback simulation mapping
        err_type = error.error_type
        if "division" in error.message.lower() or "zero" in error.message.lower() or "rangeerror" in err_type.lower():
            res = dict(MOCK_RESPONSES["RangeError"])
        elif "receiver" in error.message.lower() or "existence" in error.message.lower():
            res = dict(MOCK_RESPONSES["UndefinedReceiver"])
        else:
            res = dict(MOCK_RESPONSES["TypeError"])
        res["tokens_used"] = 520
        return res

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    
    memory_context = ""
    if memory_hits:
        memory_context = "\n\nRELEVANT PAST FIXES FROM MEMORY:\n"
        for i, hit in enumerate(memory_hits[:3], 1):
            memory_context += (
                f"\n[Memory {i}] similarity={hit.similarity_score:.2f}\n"
                f"Error: {hit.error_type}: {hit.message}\n"
                f"Fix: {hit.fix_summary}\n"
                f"Patch:\n{hit.patch_diff}\n"
                f"Outcome: {hit.outcome}\n"
                f"Previous Root Cause: {hit.previous_root_cause}\n"
            )

    user_message = (
        f"INCOMING ERROR\n"
        f"Type: {error.error_type}\n"
        f"Message: {error.message}\n"
        f"File: {error.file_path}:{error.line_number}\n"
        f"Language: {error.language}\n"
        f"Severity: {error.severity}\n"
        f"Service Name: {error.service_name}\n"
        f"Stack trace:\n{error.stack_trace}"
        f"{memory_context}"
    )

    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw = response.content[0].text.strip()
        
        if raw.startswith("```"):
            lines = raw.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            raw = "\n".join(lines).strip()
            
        result = json.loads(raw)
        result["tokens_used"] = response.usage.input_tokens + response.usage.output_tokens
        return result
    except Exception as e:
        err_type = error.error_type
        if "division" in error.message.lower() or "zero" in error.message.lower() or "rangeerror" in err_type.lower():
            res = dict(MOCK_RESPONSES["RangeError"])
        elif "receiver" in error.message.lower():
            res = dict(MOCK_RESPONSES["UndefinedReceiver"])
        else:
            res = dict(MOCK_RESPONSES["TypeError"])
        res["tokens_used"] = 0
        res["root_cause"] = f"Fallback reasoning due to LLM error ({str(e)}). " + res["root_cause"]
        return res
