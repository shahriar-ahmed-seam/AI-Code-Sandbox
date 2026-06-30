import Link from "next/link";
import { Reveal } from "./ui/Reveal";

export function CTA() {
  return (
    <section className="container-x py-28">
      <Reveal className="relative overflow-hidden rounded-3xl border border-hairline bg-panel px-8 py-20 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(60% 120% at 50% 0%, rgba(59,130,246,0.16), transparent 60%), radial-gradient(50% 120% at 50% 100%, rgba(139,92,246,0.14), transparent 60%)",
          }}
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tightest text-white sm:text-5xl sm:leading-[1.05]">
            Give your agent a safe place to run.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-white/55">
            Spin up the playground, or wire the API into your pipeline in a single request.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/playground" className="btn-primary px-6 py-3 text-[15px]">
              Open the playground
            </Link>
            <a href="#api" className="btn-secondary px-6 py-3 text-[15px]">
              View the API
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
