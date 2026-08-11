import Link from "next/link";
import { concepts } from "@/lib/concepts";

const levelLabel = {
  fundamentals: "Fundamentals",
  core: "Core DAX",
  advanced: "Advanced",
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
        Learn Power BI concepts
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
        Short lessons that pair with the lab — read a concept, then try it on sample data.
      </p>

      <div className="mt-10 divide-y divide-[var(--ink)]/8 border-y border-[var(--ink)]/8">
        {concepts.map((c) => (
          <Link
            key={c.slug}
            href={`/learn/${c.slug}`}
            className="group flex flex-col gap-2 py-5 transition sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--teal)]">
                {levelLabel[c.level]} · {c.readingMinutes} min
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] group-hover:text-[var(--teal)]">
                {c.title}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-[var(--ink-muted)]">{c.summary}</p>
            </div>
            <span className="text-sm font-medium text-[var(--teal)]">Read →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
