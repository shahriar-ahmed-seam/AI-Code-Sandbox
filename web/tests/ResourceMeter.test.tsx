import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResourceMeter } from "@/components/ResourceMeter";
import type { ExecutionResult } from "@/lib/api";

function makeResult(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    job_id: "j1",
    language: "python",
    stdout: "",
    stderr: "",
    exit_code: 0,
    duration_ms: 150,
    memory_kb: 2048,
    timed_out: false,
    oom_killed: false,
    status: "completed",
    ...overrides,
  };
}

describe("ResourceMeter", () => {
  it("shows Success for a clean exit and formats memory in MB", () => {
    render(<ResourceMeter result={makeResult()} />);
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("2.0 MB")).toBeInTheDocument();
    expect(screen.getByText("150 ms")).toBeInTheDocument();
  });

  it("formats sub-megabyte memory in KB and seconds for long runs", () => {
    render(<ResourceMeter result={makeResult({ memory_kb: 512, duration_ms: 2500 })} />);
    expect(screen.getByText("512 KB")).toBeInTheDocument();
    expect(screen.getByText("2.50 s")).toBeInTheDocument();
  });

  it("labels a timeout", () => {
    render(<ResourceMeter result={makeResult({ timed_out: true, status: "timeout", exit_code: 137 })} />);
    expect(screen.getByText("Timed out")).toBeInTheDocument();
  });

  it("labels an out-of-memory kill", () => {
    render(<ResourceMeter result={makeResult({ oom_killed: true, exit_code: 137, status: "error" })} />);
    expect(screen.getByText("Out of memory")).toBeInTheDocument();
  });

  it("labels a non-zero exit as Error", () => {
    render(<ResourceMeter result={makeResult({ exit_code: 1, status: "completed" })} />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });
});
