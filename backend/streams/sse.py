import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator

router = APIRouter()

subscribers: list[asyncio.Queue] = []

async def broadcast(data: dict):
    dead = []
    for q in subscribers:
        try:
            await q.put(data)
        except Exception:
            dead.append(q)
    for q in dead:
        subscribers.remove(q)

async def event_stream(queue: asyncio.Queue) -> AsyncGenerator[str, None]:
    try:
        while True:
            # Wake up every 30 seconds to keep connection alive if no events occur
            try:
                data = await asyncio.wait_for(queue.get(), timeout=30)
                yield f"data: {json.dumps(data)}\n\n"
            except asyncio.TimeoutError:
                yield "data: {\"type\":\"ping\"}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        if queue in subscribers:
            subscribers.remove(queue)

@router.get("/events")
async def stream_events():
    queue: asyncio.Queue = asyncio.Queue()
    subscribers.append(queue)
    return StreamingResponse(
        event_stream(queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
