# Implementation Plan

## Overview

This plan builds AI-Code-Sandbox bottom-up: the Sandbox Runner (the security-critical core) first, then its language images, then the Orchestrator API, then the Web playground, and finally the infrastructure/deployment glue. Each task is incremental, test-backed where applicable, and traces to requirements.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "dependsOn": [] },
    { "wave": 2, "tasks": ["2", "3"], "dependsOn": ["1"] },
    { "wave": 3, "tasks": ["4"], "dependsOn": ["1", "2", "3"] },
    { "wave": 4, "tasks": ["5"], "dependsOn": ["1", "4"] },
    { "wave": 5, "tasks": ["6"], "dependsOn": ["2", "3", "4", "5"] }
  ]
}
```

```
1 (scaffold)
└─▶ 2 Sandbox Runner ──▶ 3 Language images
        │                      │
        ▼                      ▼
   4 Orchestrator ◀────────────┘
        │
        ▼
   5 Web playground
        │
        ▼
   6 Infra / deploy / CI  (depends on 2,3,4,5)
```

- Task 1 has no dependencies.
- Task 2 depends on 1. Sub-tasks 2.1→2.6 are sequential.
- Task 3 depends on 1 (used by 2.3 at runtime).
- Task 4 depends on 1; integrates with 2/3 at runtime.
- Task 5 depends on 1; integrates with 4 at runtime.
- Task 6 depends on 2, 3, 4, and 5.

## Tasks

- [x] 1. Initialize repository scaffolding and shared docs
  - Create root README, .gitignore, .editorconfig, LICENSE, and top-level folder layout (web/, orchestrator/, sandbox/, sandbox-images/, infra/, .github/).
  - _Requirements: 8.3, 8.4_

- [x] 2. Build the Sandbox Runner (Go) core
- [x] 2.1 Set up Go module, config loader, and HTTP scaffolding
  - Initialize go.mod, implement env-driven config with safe defaults and server-side clamping of memory/cpu/timeout/pids, add `/healthz` and `/run` handlers with JSON encode/decode.
  - _Requirements: 3.1, 3.2, 3.3, 5.4, 7.1_
- [x] 2.2 Implement the language registry and request validation
  - Map language → image/extension/command; validate incoming run requests; reject unsupported languages.
  - _Requirements: 1.3, 2.1_
- [x] 2.3 Implement the Docker-driven runner with full hardening
  - Create containers with network=none, read-only rootfs + tmpfs workspace, CapDrop ALL, no-new-privileges, non-root user, and cgroup memory/cpu/pids limits; deliver code via base64 entrypoint into tmpfs (no host mounts).
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 5.3_
- [x] 2.4 Implement timeout supervision, output capture, and telemetry
  - Wait with context deadline, kill on timeout, demux stdout/stderr, detect OOM, capture exit code, duration, and peak memory.
  - _Requirements: 3.4, 3.5_
- [x] 2.5 Implement lifecycle cleanup, orphan reaper, and concurrency gate
  - Force-remove containers after every job with retry, label containers and reap orphans on boot + periodically, enforce max-concurrency semaphore returning 429 when saturated.
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
- [x] 2.6 Write Go unit tests
  - Test config clamping, language registry, request validation, and entrypoint command building (no Docker daemon required); gate Docker integration test behind env flag.
  - _Requirements: 3.1, 3.2, 3.3, 1.3, 5.4_

- [x] 3. Build the sandbox language images
  - Author minimal, pinned Dockerfiles for Python, Node, and Go runners with a non-root user and a shared entrypoint that decodes base64 code into the workspace and executes it.
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 4. Build the Orchestrator (FastAPI)
- [x] 4.1 Set up project, config, and pydantic models
  - Create FastAPI app, settings via env, ExecutionRequest/ExecutionResult models with bounded fields and code-size guard.
  - _Requirements: 1.1, 1.2, 1.5, 5.4_
- [x] 4.2 Implement endpoints and Sandbox Runner client
  - `/health`, `/api/v1/languages`, `/api/v1/execute`; async httpx client to the runner; map upstream errors to 503 and runner 429 through.
  - _Requirements: 1.1, 1.3, 1.4, 7.1, 7.3_
- [x] 4.3 Implement security middleware
  - API-key auth dependency, per-client token-bucket rate limiting (429), CORS with allowed origins, structured JSON logging with job telemetry.
  - _Requirements: 5.1, 5.2, 5.5, 7.2_
- [x] 4.4 Write pytest suite
  - Cover validation, language listing, auth on/off, rate limiting, and upstream-failure mapping with httpx mocked.
  - _Requirements: 1.2, 1.3, 5.1, 5.2, 7.3_

- [x] 5. Build the Web playground (Next.js)
- [x] 5.1 Scaffold Next.js app with Tailwind and design system
  - App Router project, Tailwind config with professional dark theme tokens, base layout, Navbar, Footer, fonts.
  - _Requirements: 6.1, 6.6_
- [x] 5.2 Build the landing/hero page
  - Hero section with value proposition + CTA, feature grid, security highlights; placeholders for provided assets (logo, hero image).
  - _Requirements: 6.1, 6.6_
- [x] 5.3 Build the playground UI
  - Monaco code editor, language selector, run button with loading state, OutputConsole (stdout/stderr/exit code), ResourceMeter (duration/memory), error/timeout messaging.
  - _Requirements: 6.2, 6.3, 6.4, 6.5_
- [x] 5.4 Implement the API client and wire it to the playground
  - `lib/api.ts` using `NEXT_PUBLIC_API_BASE_URL` and optional `X-API-Key`; typed result handling and error mapping.
  - _Requirements: 6.3, 6.5, 8.1_
- [x] 5.5 Add frontend component tests
  - Vitest + Testing Library tests for OutputConsole, ResourceMeter, and API client error mapping.
  - _Requirements: 6.3, 6.5_

- [x] 6. Infrastructure, deployment, and CI
- [x] 6.1 Author docker-compose for the full local stack
  - Compose builds language images + runner + orchestrator + web; runner mounts the Docker socket; wire env and an internal network.
  - _Requirements: 8.3, 8.4_
- [x] 6.2 Author deployment configs for Render and Vercel
  - `render.yaml` for orchestrator (+ runner notes), `vercel.json`/env docs for the frontend, example `.env` files for all services.
  - _Requirements: 8.1, 8.2, 8.4_
- [x] 6.3 Add GitHub Actions CI
  - Workflow running Go tests, pytest, and the frontend build/test on push/PR.
  - _Requirements: 8.5_
- [x] 6.4 Write end-to-end smoke script and finalize docs
  - Script that submits a snippet per language against the running stack and asserts output + container cleanup; complete README with architecture, security model, run, and deploy instructions; list the exact assets needed from the user.
  - _Requirements: 7.2, 4.1, 8.3_

## Notes

- The Sandbox Runner requires access to a Docker daemon. Docker-dependent execution tests are gated behind an env flag so unit suites run without a daemon.
- Initial languages: Python, Node.js, Go. The language registry makes adding more trivial.
- Deployment targets: Web → Vercel, Orchestrator → Render, Runner → any Docker-capable host. Local development uses docker-compose.
- Assets (logo, hero image, favicon) are wired as placeholders and documented in the README for the user to supply.
