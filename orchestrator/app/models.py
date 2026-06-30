from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

SUPPORTED_LANGUAGES: list[dict[str, str]] = [
    {"id": "python", "name": "Python", "version": "3.12"},
    {"id": "node", "name": "Node.js", "version": "20"},
    {"id": "go", "name": "Go", "version": "1.22"},
]

SUPPORTED_IDS = {lang["id"] for lang in SUPPORTED_LANGUAGES}


class Language(BaseModel):
    id: str
    name: str
    version: str


class ExecutionRequest(BaseModel):
    language: str = Field(..., description="Language id, e.g. 'python'")
    code: str = Field(..., min_length=1, description="Source code to execute")
    stdin: str = Field(default="", description="Optional standard input")
    timeout_ms: int | None = Field(
        default=None, ge=1, description="Requested wall-clock timeout (clamped server-side)"
    )

    @field_validator("language")
    @classmethod
    def normalize_language(cls, v: str) -> str:
        return v.strip().lower()


class ExecutionResult(BaseModel):
    job_id: str
    language: str
    stdout: str
    stderr: str
    exit_code: int
    duration_ms: int
    memory_kb: int
    timed_out: bool
    oom_killed: bool
    status: str
