from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from ingest.normalizer import normalize_custom
from agent.pipeline import run_pipeline, approve_pipeline

router = APIRouter()

class CustomErrorPayload(BaseModel):
    error_type: str
    message: str
    stack_trace: str
    file_path: str = None
    line_number: int = None
    language: str = "javascript"

@router.post("/custom")
async def custom_error(payload: CustomErrorPayload, background_tasks: BackgroundTasks):
    error = normalize_custom(payload.dict())
    background_tasks.add_task(run_pipeline, error)
    return {"status": "received", "error_type": error.error_type}

@router.post("/confirm/{pipeline_id}")
async def confirm_deployment(pipeline_id: str):
    success = await approve_pipeline(pipeline_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pipeline not found or not in waiting state")
    return {"status": "approved", "pipeline_id": pipeline_id}
