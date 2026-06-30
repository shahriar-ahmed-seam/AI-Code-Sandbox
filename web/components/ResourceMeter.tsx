import type { ExecutionResult } from "@/lib/api";

function formatMemory(kb: number): string {
  if (kb <= 0) return "—";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

interface Props {
  result: ExecutionResult;
}

export function ResourceMeter({ result }: Props) {
  const statusTone =
    result.status === "completed" && result.exit_code === 0
      ? "text-emerald-400"
      : result.timed_out
        ? "text-amber-400"
        : "text-rose-400";

  const statusLabel = result.timed_out
    ? "Timed out"
    : result.oom_killed
      ? "Out of memory"
      : result.status === "completed" && result.exit_code === 0
        ? "Success"
        : "Error";

  const metrics = [
    { label: "Status", value: statusLabel, tone: statusTone },
    { label: "Exit code", value: String(result.exit_code) },
    { label: "Duration", value: formatDuration(result.duration_ms) },
    { label: "Peak memory", value: formatMemory(result.memory_kb) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-4">
      {metrics.map((m) => (
        <div key={m.label} className="bg-black px-4 py-3">
          <dt className="eyebrow">{m.label}</dt>
          <dd className={`mt-1 font-mono text-sm font-medium ${m.tone ?? "text-white/90"}`}>
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
