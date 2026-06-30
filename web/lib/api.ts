export interface Language {
  id: string;
  name: string;
  version: string;
}

export interface ExecutionResult {
  job_id: string;
  language: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
  memory_kb: number;
  timed_out: boolean;
  oom_killed: boolean;
  status: string;
}

export interface ExecuteParams {
  language: string;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) h["X-API-Key"] = API_KEY;
  return h;
}

async function toApiError(res: Response): Promise<ApiError> {
  let detail = res.statusText || "request failed";
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (body?.detail?.error) detail = body.detail.error;
    else if (body?.error) detail = body.error;
  } catch {
  }
  const friendly: Record<number, string> = {
    401: "Authentication failed — check your API key.",
    413: "Your code is too large to run.",
    429: "Too many requests — please slow down and retry.",
    503: "The execution backend is unavailable. Try again shortly.",
  };
  return new ApiError(friendly[res.status] ?? detail, res.status);
}

export async function fetchLanguages(): Promise<Language[]> {
  const res = await fetch(`${BASE_URL}/api/v1/languages`, { headers: headers() });
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

export async function executeCode(params: ExecuteParams): Promise<ExecutionResult> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/v1/execute`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        language: params.language,
        code: params.code,
        stdin: params.stdin ?? "",
        timeout_ms: params.timeoutMs,
      }),
    });
  } catch {
    throw new ApiError("Could not reach the server. Is the API running?", 0);
  }
  if (!res.ok) throw await toApiError(res);
  return res.json();
}
