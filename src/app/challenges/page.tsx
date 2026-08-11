import Link from "next/link";
import { challenges } from "@/lib/challenges";
import { domains } from "@/lib/domains";

const difficultyColor: Record<string, string> = {
  beginner: "text-emerald-800 bg-emerald-50",
  intermediate: "text-amber-900 bg-amber-50",
  advanced: "text-rose-900 bg-rose-50",
};

export default function ChallengesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
        Challenges
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--ink-muted)]">
        Pick a prompt, open it in the lab, and Run until the result matches. Hints and solutions are available when you need them.
      </p>

      <div className="mt-10 space-y-12">
        {domains.map((domain) => {
          const list = challenges.filter((c) => c.domainId === domain.id);
          return (
            <section key={domain.id}>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  {domain.name}
                </h2>
                <Link
                  href={`/practice?domain=${domain.id}`}
                  className="text-xs font-medium text-[var(--teal)] hover:underline"
                >
                  Open {domain.name} lab
                </Link>
              </div>
              <ul className="divide-y divide-[var(--ink)]/8 border-y border-[var(--ink)]/8">
                {list.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[var(--ink)]">{c.title}</h3>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${difficultyColor[c.difficulty]}`}
                        >
                          {c.difficulty}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
                          {c.mode}
                        </span>
                      </div>
                      <p className="mt-1 max-w-xl text-sm text-[var(--ink-muted)]">{c.prompt}</p>
                    </div>
                    <Link
                      href={`/practice?domain=${domain.id}&challenge=${c.id}`}
                      className="shrink-0 rounded-lg bg-[var(--teal)] px-3.5 py-2 text-center text-xs font-semibold text-white hover:bg-[var(--teal-dark)]"
                    >
                      Practice
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
