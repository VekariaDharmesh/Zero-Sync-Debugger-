from memory.schemas import ErrorRecord
from typing import Any, Dict

def normalize_sentry(payload: Dict[str, Any]) -> ErrorRecord:
    event = payload.get("event", {})
    exception = event.get("exception", {}).get("values", [{}])[0]
    stacktrace = exception.get("stacktrace", {}).get("frames", [])
    top_frame = stacktrace[-1] if stacktrace else {}
    stack_lines = []
    for frame in stacktrace[-8:]:
        stack_lines.append(
            f"  at {frame.get('function', '?')} ({frame.get('filename', '?')}:{frame.get('lineno', '?')})"
        )
    return ErrorRecord(
        error_type=exception.get("type", "UnknownError"),
        message=exception.get("value", "No message"),
        stack_trace="\n".join(stack_lines),
        file_path=top_frame.get("filename"),
        line_number=top_frame.get("lineno"),
        language="javascript",
    )

def normalize_custom(payload: Dict[str, Any]) -> ErrorRecord:
    return ErrorRecord(
        error_type=payload.get("error_type", "Error"),
        message=payload.get("message", ""),
        stack_trace=payload.get("stack_trace", ""),
        file_path=payload.get("file_path"),
        line_number=payload.get("line_number"),
        language=payload.get("language", "unknown"),
    )
