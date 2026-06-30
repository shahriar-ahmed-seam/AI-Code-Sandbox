"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";

type Lang = "python" | "node" | "go";

const snippets: Record<Lang, { label: string; code: string; stdout: string; ms: number; mem: string }> = {
  python: {
    label: "Python",
    code: `def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print([fib(i) for i in range(10)])`,
    stdout: "[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]",
    ms: 213,
    mem: "1.3 MB",
  },
  node: {
    label: "Node.js",
    code: `const pow = (b, e) => b ** e;
console.log("2^64 =", (2n ** 64n).toString());
console.log("answer:", pow(6, 2) + 6);`,
    stdout: "2^64 = 18446744073709551616\nanswer: 42",
    ms: 191,
    mem: "4.4 MB",
  },
  go: {
    label: "Go",
    code: `package main

import "fmt"

func main() {
	sum := 0
	for i := 1; i <= 100; i++ {
		sum += i
	}
	fmt.Println("sum:", sum)
}`,
    stdout: "sum: 5050",
    ms: 375,
    mem: "7.2 MB",
  },
};

const order: Lang[] = ["python", "node", "go"];

export function CodeShowcase() {
  const [lang, setLang] = useState<Lang>("python");
  const s = snippets[lang];

  return (
    <section id="api" className="container-x py-28">
      <SectionHeading
        eyebrow="Developer experience"
        title="One request. Full execution telemetry."
        subtitle="No SDK lock-in. Send code, get stdout, stderr, exit code, duration, and peak memory back."
      />

      <Reveal className="mt-14">
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-hairline bg-white/[0.02] px-4">
            <div className="flex">
              {order.map((id) => (
                <button
                  key={id}
                  onClick={() => setLang(id)}
                  className={`relative px-4 py-3.5 text-sm transition-colors ${
                    lang === id ? "text-white" : "text-white/45 hover:text-white/70"
                  }`}
                >
                  {snippets[id].label}
                  {lang === id && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute inset-x-3 -bottom-px h-px bg-white"
                    />
                  )}
                </button>
              ))}
            </div>
            <span className="hidden font-mono text-xs text-white/30 sm:block">
              POST /api/v1/execute
            </span>
          </div>

          <div className="grid lg:grid-cols-2">
            <div className="border-b border-hairline lg:border-b-0 lg:border-r">
              <AnimatePresence mode="wait">
                <motion.pre
                  key={lang}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="scroll-thin overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-white/85"
                >
                  {s.code}
                </motion.pre>
              </AnimatePresence>
            </div>

            <div className="bg-black/40 p-6">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                response · {s.ms}ms · {s.mem}
              </div>
              <AnimatePresence mode="wait">
                <motion.pre
                  key={lang}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 whitespace-pre-wrap font-mono text-[13px] leading-relaxed"
                >
<span className="text-white/40">{`{`}</span>
{`\n  "stdout": `}<span className="text-emerald-300">{JSON.stringify(s.stdout)}</span>{`,
  "exit_code": `}<span className="text-blue-300">0</span>{`,
  "status": `}<span className="text-emerald-300">{`"completed"`}</span>{`,
  "duration_ms": `}<span className="text-blue-300">{s.ms}</span>{`,
  "timed_out": `}<span className="text-blue-300">false</span>{`
`}<span className="text-white/40">{`}`}</span>
                </motion.pre>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
