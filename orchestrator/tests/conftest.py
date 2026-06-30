from __future__ import annotations

import os

import pytest

os.environ.setdefault("SANDBOX_URL", "http://sandbox.test")
os.environ.setdefault("API_KEY", "")
os.environ.setdefault("ALLOWED_ORIGINS", "*")
os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "600")
os.environ.setdefault("RATE_LIMIT_BURST", "100")

from app.config import get_settings  # noqa: E402
from app.security import reset_limiter  # noqa: E402


@pytest.fixture
def settings():
    return get_settings()


@pytest.fixture(autouse=True)
def _clean_state(settings):
    original_key = settings.api_key
    original_per_minute = settings.rate_limit_per_minute
    original_burst = settings.rate_limit_burst
    reset_limiter()
    yield
    settings.api_key = original_key
    settings.rate_limit_per_minute = original_per_minute
    settings.rate_limit_burst = original_burst
    reset_limiter()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app.main import create_app

    app = create_app()
    with TestClient(app) as c:
        yield c


SANDBOX_RESULT = {
    "job_id": "abc123",
    "language": "python",
    "stdout": "hello\n",
    "stderr": "",
    "exit_code": 0,
    "duration_ms": 42,
    "memory_kb": 2048,
    "timed_out": False,
    "oom_killed": False,
    "status": "completed",
}
