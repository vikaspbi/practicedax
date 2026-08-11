import { Suspense } from "react";
import { PracticeLabClient } from "./PracticeLabClient";

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-[var(--ink-muted)]">
          Loading lab…
        </div>
      }
    >
      <PracticeLabClient />
    </Suspense>
  );
}
