# Design Document

## Overview

AI-Code-Sandbox is composed of three independently deployable services plus shared infrastructure:

1. **Web (Next.js)** — Modern playground + marketing hero. Deployed to Vercel.
2. **Orchestrator (FastAPI / Python)** — Public API gateway: auth, validation, rate limiting, routing, telemetry shaping. Deployed to Render.
3. **Sandbox Runner (Go)** — Internal execution engine that drives the Docker Engine API to create hardened, ephemeral containers, supervise them, and reap them. Runs on a Docker-capable host.

The trust boundary is sharp: the Orchestrator is the only public surface. The Sandbox Runner is private (internal network only) and is the sole component allowed to talk to the Docker daemon. Untrusted code only ever runs inside a throwaway container that has no network, no host mounts, a read-only rootfs, dropped capabilities, and enforced cgroup limits.

```
 ┌────────────┐      HTTPS       ┌────────────────┐   internal HTTP   ┌──────────────────┐   Docker API   ┌───────────────┐
 │  Browser   │  ───────────▶    │  Orchestrator  │  ──────────────▶  │  Sandbox Runner  │  ───────────▶  │  Ephemeral    │
 │ (Next.js)  │   /api/execute   │   (FastAPI)    │     /run          │      (Go)        │   create/exec  │  Container    │
 │  Vercel    │  ◀───────────    │    Render      │  ◀──────────────  │  Docker host     │   /stats/rm    │  (no network) │
 └────────────┘   JSON result    └────────────────┘   JSON result     └──────────────────┘                └───────────────┘
        auth: API key                rate limit, validate,                   concurrency gate,                  read-only rootfs
                                      bound limits, CORS                      timeout kill, cleanup              cgroup mem/cpu/pids
```

## Architecture

### Architecture Decisions

| Decision                     | Choice                                    | Rationale                                                                                                                                       |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Sandbox language             | Go                                        | Official Docker SDK, great concurrency primitives (context cancellation, goroutines), single static binary — matches spec's "Go or Rust".      |
| Isolation primitive          | Docker containers                         | Portable, ships everywhere Render/EC2/local supports; uses Linux namespaces + cgroups under the hood. Firecracker noted as future upgrade path. |
| Orchestrator/runner split    | Two services                              | Keeps the Docker-privileged component off the public internet (defense in depth). Orchestrator can scale statelessly.                           |
| Per-language images          | Prebuilt minimal images                   | Avoids pulling at runtime; pinned versions; smaller attack surface.                                                                             |
| Code delivery into container | tmpfs workspace + stdin/cmd               | No host bind mounts → nothing on host is reachable.                                                                                            |
| Frontend                     | Next.js 14 App Router + Tailwind + Monaco | Vercel-native, fast, modern aesthetic, professional editor UX.                                                                                  |

## Components and Interfaces

### Web (Next.js)

- **Pages**: `/` (hero + features), `/playground` (editor + runner).
- **Key components**: `Hero`, `FeatureGrid`, `CodeEditor` (Monaco), `LanguageSelector`, `OutputConsole`, `ResourceMeter`, `RunButton`, `Navbar`, `Footer`.
- **API client** (`lib/api.ts`): calls Orchestrator using `NEXT_PUBLIC_API_BASE_URL`; sends `X-API-Key` when configured.
- **Design system**: dark, professional palette (slate/indigo accent), monospace for code, subtle motion, glassmorphism cards. No generic "AI slop" gradients — clean, enterprise-grade.

#### Frontend ↔ Orchestrator contract

```
POST {API_BASE}/api/v1/execute
Headers: X-API-Key (optional)
Body: { "language": "python", "code": "...", "stdin": "", "timeout_ms": 5000 }
200 → ExecutionResult
```

### Orchestrator (FastAPI)

- **Endpoints**
  - `GET /health` → `{status, version}`
  - `GET /api/v1/languages` → `[{id, name, version}]`
  - `POST /api/v1/execute` → `ExecutionResult`
- **Middleware/cross-cutting**: API-key auth dependency (toggle via `API_KEY` env), token-bucket rate limiter (per client IP/key), CORS, request-size guard, structured logging (structlog-style JSON).
- **Validation** (pydantic models): bound `timeout_ms`, code size, language whitelist. Server-side caps always win over client values.
- **Routing**: httpx async client → Sandbox Runner `SANDBOX_URL`. Maps upstream failures to 503; maps runner timeouts to a typed result.

### Sandbox Runner (Go)

- **Endpoints**
  - `GET /healthz` → readiness (also pings Docker daemon).
  - `POST /run` → `RunResponse`.
- **Internal modules**
  - `config`: env-driven limits (mem MB, cpu nanos, pids, timeout, max concurrency, image map).
  - `docker`: thin wrapper over the official `github.com/docker/docker/client` SDK.
  - `runner`: orchestrates one job — create → start → wait(ctx timeout) → collect logs → stats → force remove.
  - `reaper`: on boot and periodically, lists and removes orphaned containers labeled `ai-sandbox=true`.
  - `semaphore`: buffered channel enforcing `MAX_CONCURRENCY`; returns 429 when full.
- **Hardening flags per container**:
  - `NetworkMode: "none"`
  - `ReadonlyRootfs: true`, tmpfs mount at `/workspace` and `/tmp` with `size`,`noexec` where possible
  - `CapDrop: ["ALL"]`, `SecurityOpt: ["no-new-privileges:true"]`
  - `User: "65534:65534"` (nobody) where image allows
  - `Resources`: `Memory`, `MemorySwap` (= Memory, disable swap), `NanoCPUs`, `PidsLimit`
  - Label `ai-sandbox=true` for reaping
  - `AutoRemove` off (we remove explicitly to guarantee log/stat capture)

#### Orchestrator ↔ Runner contract

```
POST {SANDBOX_URL}/run
Body: { "language": "python", "code": "...", "stdin": "", "timeout_ms": 5000 }
200 → { "stdout","stderr","exit_code","duration_ms","timed_out","oom_killed","memory_kb" }
```

### Execution flow (one job)

1. Runner picks the image for the language (e.g. `ai-sandbox-python:latest`).
2. Build command: write user code to `/workspace/main.<ext>` via an entry wrapper, then run the interpreter/compiler.
   - To avoid host mounts, code is passed as a base64 env var and a tiny shell entrypoint decodes it into the tmpfs workspace, then executes.
3. Create container (hardened config) → start.
4. `ContainerWait` with a context deadline = timeout. If deadline fires → `ContainerKill` → mark `timed_out`.
5. Read logs (stdout/stderr demuxed), inspect for OOM (`State.OOMKilled`), read exit code.
6. Collect a one-shot stats sample for peak memory if available.
7. `ContainerRemove(force)`; on error, enqueue for reaper.

## Data Models

### ExecutionResult (shared shape)

```json
{
  "job_id": "uuid",
  "language": "python",
  "stdout": "string",
  "stderr": "string",
  "exit_code": 0,
  "duration_ms": 123,
  "memory_kb": 20480,
  "timed_out": false,
  "oom_killed": false,
  "status": "completed | timeout | error | rejected"
}
```

### Language registry (config-driven)

```
python  → image ai-sandbox-python   ext .py   cmd ["python","main.py"]
node    → image ai-sandbox-node     ext .js   cmd ["node","main.js"]
go      → image ai-sandbox-go       ext .go   cmd ["sh","-c","go run main.go"]
```

(Initial release ships Python, Node, and Go; registry makes adding languages trivial.)

## Error Handling

| Condition               | Where                  | Response                                          |
| ----------------------- | ---------------------- | ------------------------------------------------- |
| Missing/invalid body    | Orchestrator           | 422 with field errors                             |
| Unsupported language    | Orchestrator           | 400 + supported list                              |
| Code too large          | Orchestrator           | 413                                               |
| Missing/invalid API key | Orchestrator           | 401                                               |
| Rate limit exceeded     | Orchestrator           | 429                                               |
| Concurrency saturated   | Runner → Orchestrator | 429                                               |
| Runner unreachable      | Orchestrator           | 503                                               |
| Job timeout             | Runner                 | 200 result,`status=timeout`, `timed_out=true` |
| OOM                     | Runner                 | 200 result,`oom_killed=true`                    |
| Docker daemon down      | Runner`/healthz`     | 503                                               |

All services emit structured JSON logs and never leak internal stack traces to clients.

## Security Model (defense in depth)

1. **Network boundary**: only the Orchestrator is public. Runner is on a private network. Containers get `network=none`.
2. **Kernel isolation**: namespaces (default Docker) + cgroups for mem/cpu/pids.
3. **Capability reduction**: drop ALL caps, `no-new-privileges`, non-root user, read-only rootfs.
4. **Resource bounding**: server-side hard caps on memory/cpu/timeout/pids; client values clamped.
5. **Input control**: language whitelist, code-size limit, payload validation.
6. **Access control**: API key + per-client rate limiting + restricted CORS.
7. **No persistence**: tmpfs only; container destroyed after each run.

## Correctness Properties

### Property 1: Isolation invariant

Every job runs in a container with `network=none`, read-only rootfs, dropped capabilities, and no host mounts (verifiable by inspecting the container HostConfig before start).
**Validates: Requirements 2.2, 2.3, 2.4, 2.5**

### Property 2: No-leak invariant

After a job reaches a terminal state, no container with label `ai-sandbox=true` for that job id remains (force-removed or reaped).
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 3: Bounded-resources invariant

Effective memory/cpu/timeout/pids are always ≤ the server-side maximums regardless of client input.
**Validates: Requirements 3.1, 3.2, 3.3, 5.4**

### Property 4: Termination guarantee

Any job exceeding the wall-clock timeout is killed and returns within timeout plus a bounded grace period.
**Validates: Requirements 3.4, 3.5**

### Property 5: Single public surface

Untrusted input can only reach Docker via the Orchestrator → Runner path; the Runner is never publicly exposed.
**Validates: Requirements 5.1, 7.3**

## Testing Strategy

- **Orchestrator (pytest)**: validation rules, language listing, auth, rate limiting, upstream-failure mapping (httpx mocked).
- **Runner (go test)**: config bounding/clamping, language registry, request validation, entrypoint command building. Docker-dependent execution covered by an integration test guarded behind a build tag / env flag so unit tests run without a daemon.
- **Frontend**: component render tests for OutputConsole/ResourceMeter and API client error mapping (Vitest + Testing Library).
- **Smoke/e2e**: docker-compose up, then a script that submits a known snippet per language and asserts output + that the container is gone.

## Deployment

- **Frontend → Vercel**: `web/` root, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_KEY` (optional) as env vars.
- **Orchestrator → Render**: Dockerized web service; env `SANDBOX_URL`, `API_KEY`, `ALLOWED_ORIGINS`, `RATE_LIMIT_*`.
- **Sandbox Runner → Docker host** (Render private service with Docker, or a dedicated VM): mounts the Docker socket; env for limits. Documented constraint: needs access to a Docker daemon; on platforms without Docker-in-container, deploy the runner to a Docker-capable VM and point `SANDBOX_URL` at it.
- **Local**: `docker-compose.yml` builds language images + all three services; runner mounts `/var/run/docker.sock`.
- **CI**: GitHub Actions workflow running lint/test/build for each service.

```
```
