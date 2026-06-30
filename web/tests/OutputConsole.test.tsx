import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OutputConsole } from "@/components/OutputConsole";
import type { ExecutionResult } from "@/lib/api";

const base: ExecutionResult = {
  job_id: "j1",
  language: "python",
  stdout: "hello world\n",
  stderr: "",
  exit_code: 0,
  duration_ms: 10,
  memory_kb: 100,
  timed_out: false,
  oom_killed: false,
  status: "completed",
};

describe("OutputConsole", () => {
  it("shows an empty prompt when there is no result", () => {
    render(<OutputConsole result={null} error={null} loading={false} />);
    expect(screen.getByText(/Run your code/i)).toBeInTheDocument();
  });

  it("shows a running state while loading", () => {
    render(<OutputConsole result={null} error={null} loading={true} />);
    expect(screen.getByText(/Executing in an isolated container/i)).toBeInTheDocument();
  });

  it("renders stdout", () => {
    render(<OutputConsole result={base} error={null} loading={false} />);
    expect(screen.getByText(/hello world/)).toBeInTheDocument();
  });

  it("renders stderr separately", () => {
    render(<OutputConsole result={{ ...base, stderr: "Traceback boom" }} error={null} loading={false} />);
    expect(screen.getByTestId("stderr")).toHaveTextContent("Traceback boom");
  });

  it("renders an error message with an alert role", () => {
    render(<OutputConsole result={null} error="Backend unavailable" loading={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Backend unavailable");
  });

  it("surfaces a timeout banner", () => {
    render(
      <OutputConsole
        result={{ ...base, stdout: "", timed_out: true, status: "timeout" }}
        error={null}
        loading={false}
      />,
    );
    expect(screen.getByText(/exceeded the time limit/i)).toBeInTheDocument();
  });
});
