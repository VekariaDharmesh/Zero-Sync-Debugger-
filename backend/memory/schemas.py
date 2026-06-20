from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ErrorRecord(BaseModel):
    error_type: str
    message: str
    stack_trace: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    language: Optional[str] = None
    received_at: datetime = Field(default_factory=datetime.utcnow)

class MemoryHit(BaseModel):
    id: str
    similarity_score: float
    error_type: str
    message: str
    fix_summary: str
    patch_diff: str
    outcome: str
    fixed_at: str

class FixRecord(BaseModel):
    error_record: ErrorRecord
    patch_diff: str
    fix_summary: str
    outcome: str
    tokens_used: int
    duration_seconds: float
    confidence: Optional[str] = "high"
    root_cause: Optional[str] = ""
