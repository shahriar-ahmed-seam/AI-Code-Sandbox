"""API tests for the Orchestrator with the sandbox runner mocked."""

from __future__ import annotations

import httpx
import respx

from tests.conftest import SANDBOX_RESULT

RUN_URL = "http://sandbox.test/run"
HEALTH_URL = "http://sandbox.test/healthz"


def test_languages(client):
    resp = client.get("/api/v1/languages")
    assert resp.status_code == 200
    ids = {lang["id"] for lang in resp.json()}
    assert {"python", "node", "go"} <= ids


@respx.mock
def test_health_reports_upstream(client):
    respx.get(HEALTH_URL).mock(return_value=httpx.Response(200, json={"status": "ok"}))
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["sandbox"] == "ok"


@respx.mock
def test_execute_success(client):
    route = respx.post(RUN_URL).mock(return_value=httpx.Response(200, json=SANDBOX_RESULT))
    resp = client.post("/api/v1/execute", json={"language": "python", "code": "print('hi')"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["stdout"] == "hello\n"
    assert body["status"] == "completed"
    assert route.called


def test_execute_missing_code_returns_422(client):
    resp = client.post("/api/v1/execute", json={"language": "python"})
    assert resp.status_code == 422


def test_execute_unsupported_language_returns_400(client):
    resp = client.post("/api/v1/execute", json={"language": "cobol", "code": "x"})
    assert resp.status_code == 400
    assert "supported" in resp.json()["detail"]


def test_execute_code_too_large_returns_413(client, settings):
    big = "a" * (settings.max_code_bytes + 1)
    resp = client.post("/api/v1/execute", json={"language": "python", "code": big})
    assert resp.status_code == 413


@respx.mock
def test_execute_clamps_timeout(client, settings):
    captured = {}

    def _capture(request):
        import json

        captured.update(json.loads(request.content))
        return httpx.Response(200, json=SANDBOX_RESULT)

    respx.post(RUN_URL).mock(side_effect=_capture)
    client.post(
        "/api/v1/execute",
        json={"language": "python", "code": "x=1", "timeout_ms": 9_999_999},
    )
    assert captured["timeout_ms"] == settings.max_timeout_ms


@respx.mock
def test_execute_upstream_unavailable_returns_503(client):
    respx.post(RUN_URL).mock(side_effect=httpx.ConnectError("refused"))
    resp = client.post("/api/v1/execute", json={"language": "python", "code": "x=1"})
    assert resp.status_code == 503


@respx.mock
def test_execute_upstream_busy_returns_429(client):
    respx.post(RUN_URL).mock(return_value=httpx.Response(429, json={"error": "busy"}))
    resp = client.post("/api/v1/execute", json={"language": "python", "code": "x=1"})
    assert resp.status_code == 429


@respx.mock
def test_auth_required_when_key_set(client, settings):
    settings.api_key = "secret-key"
    respx.post(RUN_URL).mock(return_value=httpx.Response(200, json=SANDBOX_RESULT))

    resp = client.post("/api/v1/execute", json={"language": "python", "code": "x=1"})
    assert resp.status_code == 401

    resp = client.post(
        "/api/v1/execute",
        json={"language": "python", "code": "x=1"},
        headers={"X-API-Key": "secret-key"},
    )
    assert resp.status_code == 200


@respx.mock
def test_rate_limiting_returns_429(client, settings):
    from app.security import reset_limiter

    settings.rate_limit_per_minute = 60
    settings.rate_limit_burst = 2
    reset_limiter()
    respx.post(RUN_URL).mock(return_value=httpx.Response(200, json=SANDBOX_RESULT))

    payload = {"language": "python", "code": "x=1"}
    codes = [client.post("/api/v1/execute", json=payload).status_code for _ in range(5)]
    assert 200 in codes
    assert 429 in codes
