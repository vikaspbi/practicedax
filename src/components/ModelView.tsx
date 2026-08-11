import type { Domain } from "@/lib/types";

export function ModelView({ domain }: { domain: Domain }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ink-muted)]">
        Relationships in the <span className="font-medium text-[var(--ink)]">{domain.name}</span> model.
        Filters on the one-side flow to the many-side.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {domain.tables.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-[var(--ink)]/10 bg-white/80 p-4"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-[family-name:var(--font-display)] text-base text-[var(--ink)]">
                {t.name}
              </h3>
              <span className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                {t.isFact ? "Fact" : "Dimension"}
              </span>
            </div>
            <ul className="space-y-1">
              {t.columns.map((c) => (
                <li key={c.name} className="flex justify-between gap-2 font-mono text-[11px]">
                  <span>{c.name}</span>
                  <span className="text-[var(--ink-muted)]">{c.type}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-[var(--teal)]/30 bg-[var(--teal)]/5 p-4">
        <h3 className="mb-2 text-sm font-semibold text-[var(--teal)]">Relationships</h3>
        <ul className="space-y-2 text-sm">
          {domain.relationships.map((r, i) => (
            <li key={i} className="font-mono text-xs text-[var(--ink)]">
              {r.fromTable}[{r.fromColumn}]
              <span className="mx-2 text-[var(--ink-muted)]">→</span>
              {r.toTable}[{r.toColumn}]
              {r.description ? (
                <span className="mt-0.5 block font-sans text-[11px] text-[var(--ink-muted)]">
                  {r.description}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
