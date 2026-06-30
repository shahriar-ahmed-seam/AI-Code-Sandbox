import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, executeCode, fetchLanguages } from "@/lib/api";

function mockFetch(status: number, body: unknown, ok = status < 400) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: "",
    json: async () => body,
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api client error mapping", () => {
  it("returns parsed result on success", async () => {
    const result = { job_id: "x", stdout: "hi\n", exit_code: 0 };
    vi.stubGlobal("fetch", mockFetch(200, result));
    await expect(executeCode({ language: "python", code: "x" })).resolves.toMatchObject({
      stdout: "hi\n",
    });
  });

  it("maps 429 to a friendly rate-limit message", async () => {
    vi.stubGlobal("fetch", mockFetch(429, { detail: "rate limit exceeded" }));
    await expect(executeCode({ language: "python", code: "x" })).rejects.toMatchObject({
      status: 429,
      message: expect.stringMatching(/slow down/i),
    });
  });

  it("maps 503 to backend-unavailable", async () => {
    vi.stubGlobal("fetch", mockFetch(503, {}));
    await expect(executeCode({ language: "python", code: "x" })).rejects.toMatchObject({
      status: 503,
      message: expect.stringMatching(/unavailable/i),
    });
  });

  it("maps 401 to an auth message", async () => {
    vi.stubGlobal("fetch", mockFetch(401, {}));
    await expect(executeCode({ language: "python", code: "x" })).rejects.toMatchObject({
      status: 401,
      message: expect.stringMatching(/API key/i),
    });
  });

  it("wraps network failures in an ApiError with status 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const err = await executeCode({ language: "python", code: "x" }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });

  it("fetchLanguages surfaces server errors", async () => {
    vi.stubGlobal("fetch", mockFetch(500, { error: "boom" }));
    await expect(fetchLanguages()).rejects.toBeInstanceOf(ApiError);
  });
});
