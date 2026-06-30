from __future__ import annotations

import threading
import time

from fastapi import Header, HTTPException, Request, status

from .config import Settings, get_settings


def require_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> None:
    settings = get_settings()
    if not settings.api_key:
        return
    if not x_api_key or x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing or invalid API key",
        )


class TokenBucket:
    __slots__ = ("capacity", "tokens", "refill_per_sec", "last")

    def __init__(self, capacity: int, refill_per_sec: float) -> None:
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.refill_per_sec = refill_per_sec
        self.last = time.monotonic()

    def allow(self) -> bool:
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.refill_per_sec)
        self.last = now
        if self.tokens >= 1.0:
            self.tokens -= 1.0
            return True
        return False


class RateLimiter:
    def __init__(self, per_minute: int, burst: int) -> None:
        self._per_sec = per_minute / 60.0
        self._burst = max(burst, 1)
        self._buckets: dict[str, TokenBucket] = {}
        self._lock = threading.Lock()

    def allow(self, identity: str) -> bool:
        with self._lock:
            bucket = self._buckets.get(identity)
            if bucket is None:
                bucket = TokenBucket(self._burst, self._per_sec)
                self._buckets[identity] = bucket
            return bucket.allow()


_limiter: RateLimiter | None = None


def _get_limiter(settings: Settings) -> RateLimiter:
    global _limiter
    if _limiter is None:
        _limiter = RateLimiter(settings.rate_limit_per_minute, settings.rate_limit_burst)
    return _limiter


def reset_limiter() -> None:
    global _limiter
    _limiter = None


def _client_identity(request: Request) -> str:
    key = request.headers.get("X-API-Key")
    if key:
        return f"key:{key}"
    client = request.client
    return f"ip:{client.host}" if client else "ip:unknown"


def enforce_rate_limit(request: Request) -> None:
    settings = get_settings()
    limiter = _get_limiter(settings)
    if not limiter.allow(_client_identity(request)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="rate limit exceeded, slow down",
        )
