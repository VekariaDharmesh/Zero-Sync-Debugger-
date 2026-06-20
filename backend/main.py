from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ingest.sentry_webhook import router as sentry_router
from ingest.custom_logger import router as custom_router
from streams.sse import router as sse_router
from memory.parcle_client import router as memory_router

app = FastAPI(title="Zero-Sync Debugger", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sentry_router, prefix="/ingest")
app.include_router(custom_router, prefix="/ingest")
app.include_router(sse_router, prefix="/stream")
app.include_router(memory_router, prefix="/memory")

@app.get("/health")
def health():
    return {"status": "ok"}
