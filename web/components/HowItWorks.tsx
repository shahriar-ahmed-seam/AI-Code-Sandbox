import { Reveal } from "./ui/Reveal";
import { SectionHeading } from "./ui/SectionHeading";

const steps = [
  {
    n: "01",
    title: "Submit",
    body: "Your agent POSTs code and a language to the orchestrator. It authenticates, rate-limits, validates, and clamps every resource limit server-side.",
  },
  {
    n: "02",
    title: "Isolate",
    body: "The runner spins up a throwaway container with no network, a read-only rootfs, dropped capabilities, and hard cgroup limits on memory, CPU, and processes.",
  },
  {
    n: "03",
    title: "Reap",
    body: "Output and telemetry are captured, the container is force-removed, and a reaper guarantees nothing leaks — every single run, no exceptions.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="container-x py-28">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps from prompt to safe output"
        subtitle="A clean request in, a structured result out — with an airtight isolation boundary in between."
      />

      <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-hairline bg-hairline md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1} className="group relative bg-black p-8">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-white/30">{s.n}</span>
              <h3 className="text-xl font-semibold tracking-tight text-white">{s.title}</h3>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">{s.body}</p>
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "radial-gradient(60% 60% at 50% 0%, rgba(59,130,246,0.08), transparent 70%)" }}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
