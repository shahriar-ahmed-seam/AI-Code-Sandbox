import type { Metadata } from "next";
import { Playground } from "@/components/Playground";

export const metadata: Metadata = {
  title: "Playground — AI-Code-Sandbox",
  description: "Write code and run it inside a secure, isolated sandbox.",
};

export default function PlaygroundPage() {
  return (
    <div className="container-x pb-20 pt-28">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow">Live playground</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tightest text-white sm:text-4xl">
          Run code in a sandbox
        </h1>
        <p className="mt-4 text-white/55">
          Your code executes in a throwaway container with no network access and strict resource
          limits. Press{" "}
          <kbd className="rounded border border-hairline bg-white/[0.03] px-1.5 py-0.5 font-mono text-xs text-white/70">
            ⌘ / Ctrl + Enter
          </kbd>{" "}
          to run.
        </p>
      </header>
      <Playground />
    </div>
  );
}
