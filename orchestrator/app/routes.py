from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from . import __version__
from .config import get_settings
from .models import (
    SUPPORTED_IDS,
    SUPPORTED_LANGUAGES,
    ExecutionRequest,
    ExecutionResult,
    Language,
)
from .sandbox_client import SandboxBusy, SandboxClient, SandboxUnavailable
from .security import enforce_rate_limit, require_api_key

router = APIRouter()
log = logging.getLogger("orchestrator")


def _client(request: Request) -> SandboxClient:
    return request.app.state.sandbox


@router.get("/health", tags=["meta"])
async def health(request: Request) -> dict:
    upstream_ok = await _client(request).healthy()
    return {
        "status": "ok",
        "version": __version__,
        "sandbox": "ok" if upstream_ok else "unavailable",
    }


@router.get("/api/v1/languages", response_model=list[Language], tags=["execution"])
async def languages() -> list[Language]:
    return [Language(**lang) for lang in SUPPORTED_LANGUAGES]


@router.post(
    "/api/v1/execute",
    response_model=ExecutionResult,
    tags=["execution"],
    dependencies=[Depends(require_api_key), Depends(enforce_rate_limit)],
)
async def execute(req: ExecutionRequest, request: Request) -> ExecutionResult:
    settings = get_settings()

    if req.language not in SUPPORTED_IDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": f"unsupported language '{req.language}'",
                "supported": sorted(SUPPORTED_IDS),
            },
        )

    if len(req.code.encode("utf-8")) > settings.max_code_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"code exceeds maximum size of {settings.max_code_bytes} bytes",
        )

    payload = {
        "language": req.language,
        "code": req.code,
        "stdin": req.stdin,
        "timeout_ms": settings.clamp_timeout(req.timeout_ms),
    }

    try:
        result = await _client(request).run(payload)
    except SandboxBusy:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="execution capacity reached, retry shortly",
        )
    except SandboxUnavailable as exc:
        log.error("sandbox unavailable", extra={"extra": {"err": str(exc)}})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="execution backend is unavailable",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    log.info(
        "execute",
        extra={
            "extra": {
                "job_id": result.get("job_id"),
                "language": req.language,
                "status": result.get("status"),
                "exit_code": result.get("exit_code"),
                "duration_ms": result.get("duration_ms"),
            }
        },
    )
    return ExecutionResult(**result)
