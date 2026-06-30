"use client";

import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { LanguageSelector } from "./LanguageSelector";
import { OutputConsole } from "./OutputConsole";
import { ResourceMeter } from "./ResourceMeter";
import { PromptComposer } from "./PromptComposer";
import { executeCode, fetchLanguages, type ExecutionResult, type Language } from "@/lib/api";
import { DEFAULT_LANGUAGE, SAMPLES } from "@/lib/samples";

const FALLBACK_LANGUAGES: Language[] = [
  { id: "python", name: "Python", version: "3.12" },
  { id: "node", name: "Node.js", version: "20" },
  { id: "go", name: "Go", version: "1.22" },
];

export function Playground() {
  const [languages, setLanguages] = useState<Language[]>(FALLBACK_LANGUAGES);
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [code, setCode] = useState(SAMPLES[DEFAULT_LANGUAGE]);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const editedRef = useRef(false);

  useEffect(() => {
    fetchLanguages()
      .then((langs) => langs.length && setLanguages(langs))
      .catch(() => {});
  }, []);

  const handleLanguageChange = (id: string) => {
    setLanguage(id);
    if (!editedRef.current && SAMPLES[id]) {
      setCode(SAMPLES[id]);
    }
  };

  const handleCodeChange = (v: string) => {
    editedRef.current = true;
    setCode(v);
  };

  const handleGenerated = (generated: string) => {
    editedRef.current = true;
    setCode(generated);
    setResult(null);
    setError(null);
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await executeCode({ language, code, stdin });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!loading) run();
    }
  };

  return (
    <div onKeyDown={onKeyDown}>
      <div className="mb-6">
        <PromptComposer
          language={language}
          languages={languages}
          onLanguageChange={handleLanguageChange}
          onGenerated={handleGenerated}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface flex min-h-[480px] flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-hairline bg-white/[0.02] px-4 py-3">
            <LanguageSelector
              languages={languages}
              value={language}
              onChange={handleLanguageChange}
              disabled={loading}
            />
            <button onClick={run} disabled={loading} className="btn-primary text-[13px]">
              {loading ? "Running…" : "Run"}
              <kbd className="ml-1 hidden rounded bg-black/15 px-1.5 py-0.5 text-[10px] font-normal sm:inline">
                ⌘↵
              </kbd>
            </button>
          </div>
          <div className="flex-1">
            <CodeEditor language={language} value={code} onChange={handleCodeChange} />
          </div>
          <div className="border-t border-hairline bg-white/[0.01] px-4 py-3">
            <label className="eyebrow mb-1.5 block">stdin (optional)</label>
            <input
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="input passed to the program"
              className="w-full rounded-lg border border-hairline bg-black px-3 py-2 font-mono text-xs text-white/90
                placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <OutputConsole result={result} error={error} loading={loading} />
          {result && <ResourceMeter result={result} />}
        </section>
      </div>
    </div>
  );
}
