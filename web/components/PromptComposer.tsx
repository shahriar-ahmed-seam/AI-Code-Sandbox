"use client";

import { useRef, useState } from "react";
import { generateCode } from "@/lib/ai";
import type { Language } from "@/lib/api";

interface Props {
  language: string;
  languages: Language[];
  onLanguageChange: (id: string) => void;
  onGenerated: (code: string) => void;
}

const SUGGESTIONS = [
  "Check whether a number is prime",
  "Print the first 15 Fibonacci numbers",
  "Reverse the words in a sentence",
  "Find the GCD of two numbers",
];

export function PromptComposer({ language, languages, onLanguageChange, onGenerated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const submit = async () => {
    const p = prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateCode(p, language);
      setModel(res.model);
      onGenerated(res.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="w-full">
      <div className="group relative rounded-2xl border border-hairline bg-elevated shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-30px_rgba(0,0,0,0.9)] transition-colors focus-within:border-white/25">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />

        <textarea
          ref={taRef}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            autoGrow();
          }}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="Ask the sandbox to write code…  e.g. “a function that checks if a number is prime”"
          className="block w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[15px] leading-relaxed text-white placeholder:text-white/30 focus:outline-none scroll-thin"
          aria-label="Describe the code you want to generate"
        />

        <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <LanguagePill language={language} languages={languages} onChange={onLanguageChange} disabled={loading} />
            <span className="hidden items-center gap-1.5 text-xs text-white/35 sm:flex">
              <span className="h-1 w-1 rounded-full bg-white/25" />
              generates &amp; loads into the editor
            </span>
          </div>

          <button
            onClick={submit}
            disabled={!prompt.trim() || loading}
            aria-label="Generate code"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
              prompt.trim() && !loading
                ? "bg-white text-black hover:bg-white/90"
                : "bg-white/10 text-white/40"
            }`}
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setPrompt(s);
              requestAnimationFrame(autoGrow);
              taRef.current?.focus();
            }}
            disabled={loading}
            className="rounded-full border border-hairline bg-white/[0.02] px-3 py-1.5 text-xs text-white/55 transition-colors hover:border-white/20 hover:text-white/80 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-2 min-h-[18px] px-1 text-xs">
        {error ? (
          <span className="text-rose-400" role="alert">{error}</span>
        ) : loading ? (
          <span className="text-white/45">Generating in {language}…</span>
        ) : model ? (
          <span className="text-white/35">
            Generated with <span className="font-mono text-white/55">{model}</span> · review &amp; press Run
          </span>
        ) : (
          <span className="text-white/30">Press Enter to generate · Shift + Enter for a new line</span>
        )}
      </div>
    </div>
  );
}

function LanguagePill({
  language,
  languages,
  onChange,
  disabled,
}: {
  language: string;
  languages: Language[];
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Target language"
        className="appearance-none rounded-full border border-hairline bg-white/[0.03] py-1.5 pl-3 pr-7 text-xs text-white/75 focus:border-white/30 focus:outline-none disabled:opacity-50"
      >
        {languages.map((l) => (
          <option key={l.id} value={l.id} className="bg-elevated text-white">
            {l.name}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/40"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
