"use client";

import { useSearchParams } from "next/navigation";
import { PracticeLab } from "@/components/PracticeLab";

export function PracticeLabClient() {
  const params = useSearchParams();
  return (
    <PracticeLab
      initialDomain={params.get("domain") ?? "sales"}
      initialChallengeId={params.get("challenge") ?? undefined}
    />
  );
}
