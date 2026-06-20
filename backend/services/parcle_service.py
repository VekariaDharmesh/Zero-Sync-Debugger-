import os
import logging
from parcle import Parcle
from typing import List, Dict, Any

logger = logging.getLogger("zero_sync.parcle_service")

# Initialize Parcle SDK
PARCLE_API_KEY = os.getenv("PARCLE_API_KEY", "")
client = None

if PARCLE_API_KEY:
    try:
        client = Parcle(api_key=PARCLE_API_KEY)
        logger.info("Parcle SDK initialized successfully with API key.")
    except Exception as e:
        logger.error(f"Failed to initialize Parcle SDK: {e}")
        client = None
else:
    logger.warning("PARCLE_API_KEY not found in environment. Falling back to local simulation.")

# Local memory cache for simulation fallback
SIMULATED_MEMORIES = []

def initialize_user(user_id: str = "zero_sync"):
    """
    Creates or initializes a Parcle user on startup.
    Handles existing-user state errors gracefully.
    """
    if not client:
        logger.info(f"Simulating user initialization for user: '{user_id}'")
        return

    try:
        # Create user
        client.create_user(user_id=user_id, name="Zero-Sync Debugger Operator")
        logger.info(f"Parcle user '{user_id}' created successfully.")
    except Exception as e:
        # Handle existing-user errors gracefully
        err_msg = str(e).lower()
        if "already exists" in err_msg or "409" in err_msg or "conflict" in err_msg:
            logger.info(f"Parcle user '{user_id}' already exists. Re-using active profile.")
        else:
            logger.error(f"Error checking/initializing Parcle user '{user_id}': {e}")

async def save_memory(
    error_type: str,
    error_message: str,
    stack_trace: str,
    root_cause: str,
    fix_summary: str,
    confidence: int,
    deployment_result: str,
    user_id: str = "zero_sync"
) -> Dict[str, Any]:
    """
    Saves resolved incident memory into Parcle vectors using ingest_dialog().
    """
    user_content = f"{error_type}: {error_message}\n\nStack Trace:\n{stack_trace}"
    assistant_content = (
        f"Root Cause:\n{root_cause}\n\n"
        f"Fix:\n{fix_summary}\n\n"
        f"Confidence:\n{confidence}\n\n"
        f"Deployment:\n{deployment_result}"
    )

    messages = [
        {"role": "user", "content": user_content},
        {"role": "assistant", "content": assistant_content}
    ]

    # Save to local cache in either case
    mem_record = {
        "error_type": error_type,
        "error_message": error_message,
        "stack_trace": stack_trace,
        "root_cause": root_cause,
        "fix_summary": fix_summary,
        "confidence": confidence,
        "deployment_result": deployment_result
    }
    SIMULATED_MEMORIES.append(mem_record)

    if not client:
        logger.info("Simulating Parcle ingest_dialog() write.")
        return {"session_id": "sim_session_12345", "event_id": "sim_event_12345", "status": "simulated"}

    try:
        # Real SDK ingest dialog
        res = client.ingest_dialog(user_id=user_id, messages=messages)
        return {
            "session_id": getattr(res, "session_id", "session_unknown"),
            "event_id": getattr(res, "event_id", "event_unknown"),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Failed to ingest dialog to Parcle: {e}")
        return {"error": str(e), "status": "failed"}

async def search_memory(
    error_message: str,
    stack_trace: str,
    error_type: str,
    user_id: str = "zero_sync"
) -> Dict[str, Any]:
    """
    Queries Parcle using search() to recall past related fixes.
    """
    query_str = f"Error Type: {error_type}\nMessage: {error_message}\nStack Trace: {stack_trace}"
    
    if not client:
        logger.info("Simulating Parcle search() recall.")
        # Find simple match in simulation cache
        sim_answers = []
        for m in SIMULATED_MEMORIES:
            if error_type.lower() in m["error_type"].lower():
                sim_answers.append(m)
        
        if sim_answers:
            ans = sim_answers[0]
            return {
                "answer": f"Root Cause:\n{ans['root_cause']}\n\nFix:\n{ans['fix_summary']}",
                "confidence": 0.92,
                "citations": [{"type": "simulated", "id": "sim_doc_1"}]
            }
        
        return {
            "answer": "No previous memories found.",
            "confidence": 0.0,
            "citations": []
        }

    try:
        # Real SDK search
        res = client.search(user_id=user_id, query=query_str)
        citations_list = []
        if hasattr(res, "citations") and res.citations:
            for cit in res.citations:
                citations_list.append({
                    "type": getattr(cit, "type", "doc"),
                    "id": getattr(cit, "id", "unknown")
                })
                
        return {
            "answer": getattr(res, "answer", "No response content generated."),
            "confidence": getattr(res, "confidence", 0.85),
            "citations": citations_list
        }
    except Exception as e:
        logger.error(f"Failed to run Parcle search: {e}")
        return {
            "answer": f"Error running search query: {e}",
            "confidence": 0.0,
            "citations": []
        }

def get_history_ledger() -> List[Dict[str, Any]]:
    """
    Returns history list of ingested memories.
    """
    return SIMULATED_MEMORIES
