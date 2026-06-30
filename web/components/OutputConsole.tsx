import type { ExecutionResult } from "@/lib/api";

interface Props {
  result: ExecutionResult | null;
  error: string | null;
  loading: boolean;
}

export function OutputConsole({ result, error, loading }: Props) {
  return (
    <div className="surface flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline bg-white/[0.02] px-4 py-2.5">
        <span className="font-mono text-xs text-white/40">output</span>
        {loading && (
          <span className="flex items-center gap-2 text-xs text-white/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            running…
          </span>
        )}
      </div>

      <div className="scroll-thin min-h-[280px] flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed">
        {loading ? (
          <p className="text-white/40">Executing in an isolated container…</p>
        ) : error ? (
          <p className="whitespace-pre-wrap text-rose-400" role="alert">
            {error}
          </p>
        ) : !result ? (
          <p className="text-white/30">Run your code to see the output here.</p>
        ) : (
          <ConsoleBody result={result} />
        )}
      </div>
    </div>
  );
}

function ConsoleBody({ result }: { result: ExecutionResult }) {
  const hasStdout = result.stdout.length > 0;
  const hasStderr = result.stderr.length > 0;

  return (
    <div className="space-y-3">
      {result.timed_out && (
        <Banner tone="amber">Execution exceeded the time limit and was terminated.</Banner>
      )}
      {result.oom_killed && (
        <Banner tone="rose">Process exceeded the memory limit and was killed.</Banner>
      )}

      {hasStdout && <pre className="whitespace-pre-wrap text-white/90">{result.stdout}</pre>}
      {hasStderr && (
        <pre className="whitespace-pre-wrap text-rose-400" data-testid="stderr">
          {result.stderr}
        </pre>
      )}
      {!hasStdout && !hasStderr && !result.timed_out && (
        <p className="text-white/30">(no output)</p>
      )}
    </div>
  );
}

function Banner({ tone, children }: { tone: "amber" | "rose"; children: React.ReactNode }) {
  const cls = tone === "amber" ? "border-amber-400/40 text-amber-400" : "border-rose-400/40 text-rose-400";
  return (
    <div className={`rounded-lg border bg-white/[0.02] px-3 py-2 text-xs ${cls}`} role="status">
      {children}
    </div>
  );
}
