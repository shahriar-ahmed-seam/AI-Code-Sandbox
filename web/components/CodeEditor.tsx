"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-600">
      Loading editor…
    </div>
  ),
});

const langToMonaco: Record<string, string> = {
  python: "python",
  node: "javascript",
  go: "go",
};

interface Props {
  language: string;
  value: string;
  onChange: (value: string) => void;
}

export function CodeEditor({ language, value, onChange }: Props) {
  return (
    <MonacoEditor
      height="100%"
      theme="vs-dark"
      language={langToMonaco[language] ?? "plaintext"}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      options={{
        fontSize: 13,
        fontFamily: "var(--font-mono), monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 14, bottom: 14 },
        smoothScrolling: true,
        renderLineHighlight: "line",
        tabSize: 2,
        automaticLayout: true,
      }}
    />
  );
}
