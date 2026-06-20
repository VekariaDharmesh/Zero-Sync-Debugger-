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
    severity: str = "error"
    service_name: str = "demo-express-service"

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

@router.post("/demo/trigger/null-ref")
async def trigger_null_ref(background_tasks: BackgroundTasks):
    payload = CustomErrorPayload(
        error_type="TypeError",
        message="Cannot read properties of undefined (reading 'name') at get user route",
        stack_trace="  at /app/index.js:15:31\n  at Layer.handle (express/lib/router/layer.js:95:5)\n  at next (express/lib/router/route.js:137:13)",
        file_path="index.js",
        line_number=15,
        language="javascript",
        severity="critical",
        service_name="demo-user-service"
    )
    error = normalize_custom(payload.dict())
    background_tasks.add_task(run_pipeline, error)
    return {"status": "triggered", "error_type": error.error_type}

@router.post("/demo/trigger/div-zero")
async def trigger_div_zero(background_tasks: BackgroundTasks):
    payload = CustomErrorPayload(
        error_type="RangeError",
        message="Division by zero produces Infinity on fee calculation",
        stack_trace="  at /app/index.js:22:15\n  at Layer.handle (express/lib/router/layer.js:95:5)\n  at next (express/lib/router/route.js:137:13)",
        file_path="index.js",
        line_number=22,
        language="javascript",
        severity="error",
        service_name="demo-payment-service"
    )
    error = normalize_custom(payload.dict())
    background_tasks.add_task(run_pipeline, error)
    return {"status": "triggered", "error_type": error.error_type}

@router.post("/demo/trigger/missing-route")
async def trigger_missing_route(background_tasks: BackgroundTasks):
    payload = CustomErrorPayload(
        error_type="TypeError",
        message="Cannot read properties of undefined (reading 'balance') on receiver update",
        stack_trace="  at /app/index.js:23:25\n  at Layer.handle (express/lib/router/layer.js:95:5)\n  at next (express/lib/router/route.js:137:13)",
        file_path="index.js",
        line_number=23,
        language="javascript",
        severity="warning",
        service_name="demo-transfer-service"
    )
    error = normalize_custom(payload.dict())
    background_tasks.add_task(run_pipeline, error)
    return {"status": "triggered", "error_type": error.error_type}
