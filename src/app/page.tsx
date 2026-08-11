import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Full-bleed hero atmosphere */}
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-5 py-16">
        <div
          className="hero-orb pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[var(--teal)]/15 blur-3xl sm:h-96 sm:w-96"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-20 h-64 w-64 rounded-full bg-[var(--accent)]/10 blur-3xl"
          aria-hidden
        />

        <p className="animate-rise font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight text-[var(--ink)] sm:text-7xl md:text-8xl">
          Practice<span className="text-[var(--teal)]">DAX</span>
        </p>
        <h1 className="animate-rise-delay mt-5 max-w-2xl text-2xl font-medium leading-snug text-[var(--ink)] sm:text-3xl">
          Write real formulas. Learn the concepts. Switch domains when you need fresh data.
        </h1>
        <p className="animate-rise-delay-2 mt-4 max-w-lg text-base text-[var(--ink-muted)]">
          Measures and calculated columns on Sales, HR, and Finance sample models — with challenges and short Power BI lessons.
        </p>
        <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
          <Link
            href="/practice"
            className="rounded-lg bg-[var(--teal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--teal-dark)]"
          >
            Open the lab
          </Link>
          <Link
            href="/learn"
            className="rounded-lg border border-[var(--ink)]/15 bg-white/70 px-5 py-2.5 text-sm font-semibold text-[var(--ink)] backdrop-blur transition hover:border-[var(--teal)]/40"
          >
            Browse concepts
          </Link>
        </div>
      </section>

      <section className="border-t border-[var(--ink)]/8 bg-white/40 py-16 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-3">
          {[
            {
              title: "Domain sample data",
              body: "Sales, HR, and Finance star schemas with relationships ready for RELATED and CALCULATE.",
            },
            {
              title: "Measures & columns",
              body: "Switch modes, run formulas instantly, and see column previews row by row.",
            },
            {
              title: "Challenges + lessons",
              body: "Guided prompts with hints and solutions, plus concept pages for filter context, CALCULATE, and more.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
