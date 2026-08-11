import { salesDomain } from "../src/lib/domains/sales";
import { getDomain } from "../src/lib/domains";
import { evaluateMeasure, evaluateCalculatedColumn } from "../src/lib/dax";
import { challenges } from "../src/lib/challenges";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

console.log("Basic measures (Sales)");
{
  const r = evaluateMeasure("SUM(Sales[Quantity])", salesDomain);
  assert("SUM quantity", r.ok && r.value === 47, r.ok ? String(r.value) : r.error);

  const rev = evaluateMeasure("SUMX(Sales, Sales[Quantity] * Sales[UnitPrice])", salesDomain);
  assert("SUMX revenue", rev.ok && rev.value === 18400, rev.ok ? String(rev.value) : rev.error);

  const bikes = evaluateMeasure(
    'CALCULATE(SUM(Sales[Quantity]), Products[Category] = "Bikes")',
    salesDomain
  );
  assert("CALCULATE bikes", bikes.ok && bikes.value === 12, bikes.ok ? String(bikes.value) : bikes.error);

  const col = evaluateCalculatedColumn("RELATED(Products[Category])", salesDomain, "Sales");
  assert(
    "RELATED category",
    col.ok && col.columnValues?.[0] === "Bikes",
    col.ok ? String(col.columnValues?.[0]) : col.error
  );
}

console.log("\nChallenge expected values");
for (const ch of challenges) {
  if (ch.mode !== "measure" || ch.expectedValue === undefined) continue;
  const domain = getDomain(ch.domainId)!;
  const r = evaluateMeasure(ch.solution, domain);
  if (!r.ok) {
    assert(ch.id, false, r.error);
    continue;
  }
  const tol = ch.tolerance ?? 0.01;
  const ok = typeof r.value === "number" && Math.abs(r.value - ch.expectedValue) <= tol;
  assert(ch.id, ok, `got ${r.value}, expected ${ch.expectedValue}`);
}

console.log("\nColumn challenges");
for (const ch of challenges) {
  if (ch.mode !== "column" || !ch.targetTable) continue;
  const domain = getDomain(ch.domainId)!;
  const r = evaluateCalculatedColumn(ch.solution, domain, ch.targetTable);
  assert(ch.id, r.ok, r.ok ? r.display : r.error);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
