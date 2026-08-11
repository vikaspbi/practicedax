"use client";

import type { Domain } from "@/lib/types";

export function DomainPicker({
  domains,
  value,
  onChange,
}: {
  domains: Domain[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {domains.map((d) => {
        const active = d.id === value;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(d.id)}
            className={`rounded-lg border px-3.5 py-2 text-left transition-all ${
              active
                ? "border-[var(--teal)] bg-[var(--teal)] text-white shadow-sm"
                : "border-[var(--ink)]/10 bg-white/70 text-[var(--ink)] hover:border-[var(--teal)]/40"
            }`}
          >
            <div className="text-sm font-semibold">{d.name}</div>
            <div className={`text-xs ${active ? "text-white/80" : "text-[var(--ink-muted)]"}`}>
              {d.tagline}
            </div>
          </button>
        );
      })}
    </div>
  );
}
