"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo.png";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-hairline bg-black/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image src={logo} alt="AI-Code-Sandbox" priority className="h-7 w-7 rounded-md" />
          <span className="text-[15px] font-semibold tracking-tightest text-white">
            AI-Code-Sandbox
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-white/55 md:flex">
          <a href="/#how" className="transition-colors hover:text-white">How it works</a>
          <a href="/#security" className="transition-colors hover:text-white">Security</a>
          <a href="/#api" className="transition-colors hover:text-white">API</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/playground"
            className="hidden text-sm text-white/70 transition-colors hover:text-white sm:block"
          >
            Playground
          </Link>
          <Link href="/playground" className="btn-primary text-[13px]">
            Start running →
          </Link>
        </div>
      </nav>
    </header>
  );
}
