"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import hero from "@/public/hero.png";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const ease = [0.21, 0.6, 0.35, 1] as const;

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
        <Image
          src={hero}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="animate-kenburns object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 bg-black/35" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(120% 90% at 50% 30%, transparent 30%, rgba(0,0,0,0.55) 75%, #000 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/80 to-transparent" aria-hidden />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="container-x relative flex h-full flex-col justify-end pb-24 sm:pb-28"
      >
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-hairline bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Secure code execution for AI agents
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05, ease }}
          className="max-w-4xl text-[2.75rem] font-semibold leading-[0.98] tracking-tightest text-white sm:text-6xl lg:text-7xl"
        >
          Run untrusted code,
          <br />
          <span className="text-gradient">without the risk.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-white/60"
        >
          Your LLM writes the code. We run it inside fully isolated, ephemeral containers — no
          network, hard resource limits, instant cleanup — behind one clean API.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease }}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <Link href="/playground" className="btn-primary px-6 py-3 text-[15px]">
            Try the playground
          </Link>
          <a href="#api" className="btn-secondary px-6 py-3 text-[15px]">
            Read the API
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute inset-x-0 bottom-7 flex justify-center"
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1">
          <motion.span
            className="h-1.5 w-1 rounded-full bg-white/60"
            animate={reduce ? {} : { y: [0, 10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
