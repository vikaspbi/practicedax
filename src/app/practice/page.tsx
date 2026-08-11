import { PracticeLab } from "@/components/PracticeLab";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; challenge?: string }>;
}) {
  const params = await searchParams;
  return (
    <PracticeLab
      initialDomain={params.domain ?? "sales"}
      initialChallengeId={params.challenge}
    />
  );
}
