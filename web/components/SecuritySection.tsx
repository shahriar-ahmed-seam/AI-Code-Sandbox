"use client";

import { useRef } from "react";
import { SectionHeading } from "./ui/SectionHeading";

const layers = [
  { k: "Network boundary", v: "Only the orchestrator is public. The runner is private; every container runs with network = none." },
  { k: "Kernel isolation", v: "Linux namespaces isolate PID, mount, IPC, and network. cgroups bound every resource per job." },
  { k: "Capability reduction", v: "CapDrop ALL, no-new-privileges, a non-root user, and a read-only root filesystem." },
  { k: "Resource bounding", v: "Server-side hard caps on memory, CPU, pids, and wall-clock time clamp every request." },
  { k: "Access control", v: "API-key auth, per-client rate limiting, restricted CORS, and strict payload size limits." },
  { k: "No persistence", v: "A tmpfs-only workspace. The container and all of its state are force-removed after each run." },
];

export function SecuritySection() {
  return (
    <section id="security" className="relative border-y border-hairline">
      <div className="absolute inset-0 bg-grid mask-fade-y opacity-40" aria-hidden />
      <div className="container-x relative py-28">
        <SectionHeading
          eyebrow="Defense in depth"
          title={<>Six layers between untrusted<br className="hidden sm:block" /> code and your host</>}
          subtitle="Security isn't one switch. Every job is wrapped in independent, overlapping controls."
        />

        <div
          className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3"
          onMouseMove={(e) => {
            const t = e.currentTarget;
            t.style.setProperty("--mx", `${e.clientX - t.getBoundingClientRect().left}px`);
            t.style.setProperty("--my", `${e.clientY - t.getBoundingClientRect().top}px`);
          }}
        >
          {layers.map((l, i) => (
            <SpotlightCard key={l.k} index={i} title={l.k} body={l.v} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SpotlightCard({ index, title, body }: { index: number; title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="group relative bg-black p-8"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--lx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--ly", `${e.clientY - r.top}px`);
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--lx) var(--ly), rgba(255,255,255,0.06), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-white/30">0{index + 1}</span>
        <h3 className="text-[15px] font-semibold tracking-tight text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/50">{body}</p>
    </div>
  );
}
