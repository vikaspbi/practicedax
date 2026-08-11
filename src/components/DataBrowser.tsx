"use client";

import { useState } from "react";
import type { Domain } from "@/lib/types";

export function DataBrowser({ domain }: { domain: Domain }) {
  const [tableName, setTableName] = useState(domain.tables[0]?.name ?? "");
  const table =
    domain.tables.find((t) => t.name === tableName) ?? domain.tables[0];

  if (!table) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {domain.tables.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setTableName(t.name)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              t.name === table.name
                ? "bg-[var(--ink)] text-white"
                : "bg-[var(--ink)]/5 text-[var(--ink-muted)] hover:bg-[var(--ink)]/10"
            }`}
          >
            {t.name}
            {t.isFact ? " · fact" : ""}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--ink-muted)]">{table.description}</p>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[var(--ink)]/10 bg-white">
        <table className="w-full min-w-max border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-[var(--mist)]">
            <tr>
              {table.columns.map((c) => (
                <th
                  key={c.name}
                  className="border-b border-[var(--ink)]/10 px-3 py-2 font-semibold text-[var(--ink)]"
                >
                  {c.name}
                  <span className="ml-1 font-normal text-[var(--ink-muted)]">{c.type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-[var(--mist)]/40">
                {table.columns.map((c) => (
                  <td key={c.name} className="border-b border-[var(--ink)]/5 px-3 py-1.5 font-mono text-[11px]">
                    {row[c.name] === null || row[c.name] === undefined
                      ? "—"
                      : String(row[c.name])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
