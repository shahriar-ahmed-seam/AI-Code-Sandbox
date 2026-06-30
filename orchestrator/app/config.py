from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    sandbox_url: str = "http://localhost:8090"
    sandbox_request_timeout_s: float = 65.0

    api_key: str = ""

    allowed_origins: str = "*"

    rate_limit_per_minute: int = 60
    rate_limit_burst: int = 20

    max_code_bytes: int = 64 * 1024
    default_timeout_ms: int = 8000
    max_timeout_ms: int = 20000

    def origins_list(self) -> list[str]:
        raw = self.allowed_origins.strip()
        if raw == "*" or raw == "":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]

    def clamp_timeout(self, requested_ms: int | None) -> int:
        if not requested_ms or requested_ms <= 0:
            return self.default_timeout_ms
        return min(requested_ms, self.max_timeout_ms)


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
