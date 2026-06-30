from __future__ import annotations

import httpx

from .config import Settings


class SandboxUnavailable(Exception):
    pass


class SandboxBusy(Exception):
    pass


class SandboxClient:
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client or httpx.AsyncClient(
            base_url=settings.sandbox_url,
            timeout=settings.sandbox_request_timeout_s,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def healthy(self) -> bool:
        try:
            resp = await self._client.get("/healthz", timeout=5.0)
            return resp.status_code == 200
        except httpx.HTTPError:
            return False

    async def run(self, payload: dict) -> dict:
        try:
            resp = await self._client.post("/run", json=payload)
        except httpx.HTTPError as exc:
            raise SandboxUnavailable(str(exc)) from exc

        if resp.status_code == 429:
            raise SandboxBusy("runner at capacity")
        if resp.status_code >= 500:
            raise SandboxUnavailable(f"runner error {resp.status_code}")
        if resp.status_code >= 400:
            detail = "bad request"
            try:
                detail = resp.json().get("error", detail)
            except Exception:
                pass
            raise ValueError(detail)
        return resp.json()
