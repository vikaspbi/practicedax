import Link from "next/link";
import { notFound } from "next/navigation";
import { concepts, getConcept } from "@/lib/concepts";
import { getChallenge } from "@/lib/challenges";

export function generateStaticParams() {
  return concepts.map((c) => ({ slug: c.slug }));
}

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concept = getConcept(slug);
  if (!concept) notFound();

  return (
    <article className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/learn" className="text-xs font-medium text-[var(--teal)] hover:underline">
        ← All concepts
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
        {concept.title}
      </h1>
      <p className="mt-3 text-base text-[var(--ink-muted)]">{concept.summary}</p>

      <div className="mt-10 space-y-8">
        {concept.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              {s.heading}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink)]/90">{s.body}</p>
          </section>
        ))}
      </div>

      {(concept.tryPrompt || (concept.relatedChallengeIds?.length ?? 0) > 0) && (
        <div className="mt-12 rounded-2xl border border-[var(--teal)]/20 bg-[var(--teal)]/5 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--teal-dark)]">
            Try it in the lab
          </h2>
          {concept.tryPrompt && (
            <p className="mt-2 text-sm text-[var(--ink)]">{concept.tryPrompt}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/practice"
              className="rounded-lg bg-[var(--teal)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--teal-dark)]"
            >
              Open lab
            </Link>
            {concept.relatedChallengeIds?.map((id) => {
              const ch = getChallenge(id);
              if (!ch) return null;
              return (
                <Link
                  key={id}
                  href={`/practice?domain=${ch.domainId}&challenge=${ch.id}`}
                  className="rounded-lg border border-[var(--ink)]/15 bg-white px-3.5 py-2 text-xs font-medium text-[var(--ink)] hover:border-[var(--teal)]/40"
                >
                  {ch.title}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
