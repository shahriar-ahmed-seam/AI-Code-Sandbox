from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .config import get_settings
from .logging_config import configure_logging
from .routes import router
from .sandbox_client import SandboxClient


@asynccontextmanager
async def lifespan(app: FastAPI):
    log = configure_logging()
    settings = get_settings()
    app.state.sandbox = SandboxClient(settings)
    log.info(
        "orchestrator starting",
        extra={"extra": {"version": __version__, "sandbox_url": settings.sandbox_url}},
    )
    try:
        yield
    finally:
        await app.state.sandbox.close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="AI-Code-Sandbox Orchestrator",
        version=__version__,
        description="Secure execution API for untrusted, AI-generated code.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.origins_list(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-API-Key"],
    )
    app.include_router(router)
    return app


app = create_app()
