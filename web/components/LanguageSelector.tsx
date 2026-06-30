"use client";

import type { Language } from "@/lib/api";

interface Props {
  languages: Language[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({ languages, value, onChange, disabled }: Props) {
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Language</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-hairline bg-white/[0.03] px-3 py-2 text-sm text-white/90
          focus:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30
          disabled:opacity-50"
        aria-label="Select language"
      >
        {languages.map((l) => (
          <option key={l.id} value={l.id} className="bg-elevated text-white">
            {l.name} {l.version}
          </option>
        ))}
      </select>
    </label>
  );
}
