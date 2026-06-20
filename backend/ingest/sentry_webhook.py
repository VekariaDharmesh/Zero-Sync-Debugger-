from fastapi import APIRouter, Request, BackgroundTasks, HTTPException
from ingest.normalizer import normalize_sentry
from agent.pipeline import run_pipeline

router = APIRouter()

@router.post("/sentry")
async def sentry_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    try:
        error = normalize_sentry(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payload parse error: {e}")
    background_tasks.add_task(run_pipeline, error)
    return {"status": "received", "error_type": error.error_type}
