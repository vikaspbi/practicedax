"use client";

import { useMemo, useState } from "react";
import { domains, getDomain } from "@/lib/domains";
import {
  evaluateCalculatedColumn,
  evaluateMeasure,
  getFactTable,
  SUPPORTED_FUNCTIONS,
} from "@/lib/dax";
import { getChallenge, getChallengesForDomain } from "@/lib/challenges";
import type { Challenge, PracticeMode } from "@/lib/types";
import { DomainPicker } from "./DomainPicker";
import { DataBrowser } from "./DataBrowser";
import { ModelView } from "./ModelView";

const EXAMPLES: Record<string, { measure: string; column: string; columnTable: string }> = {
  sales: {
    measure: "SUMX(Sales, Sales[Quantity] * Sales[UnitPrice])",
    column: "Sales[Quantity] * Sales[UnitPrice]",
    columnTable: "Sales",
  },
  hr: {
    measure: 'CALCULATE(COUNTROWS(Employees), Employees[Status] = "Active")',
    column: "RELATED(Departments[DepartmentName])",
    columnTable: "Employees",
  },
  finance: {
    measure: "SUM(Actuals[Amount]) - SUM(Budgets[BudgetAmount])",
    column: "RELATED(Accounts[Category])",
    columnTable: "Actuals",
  },
};

type SideTab = "data" | "model" | "functions" | "challenge";

function resolveInitialChallenge(id?: string): Challenge | null {
  if (!id) return null;
  return getChallenge(id) ?? null;
}

export function PracticeLab({
  initialDomain = "sales",
  initialChallengeId,
}: {
  initialDomain?: string;
  initialChallengeId?: string;
}) {
  const starter = resolveInitialChallenge(initialChallengeId);
  const startDomainId = starter?.domainId ?? initialDomain;
  const startDomain = getDomain(startDomainId) ?? domains[0];

  const [domainId, setDomainId] = useState(startDomainId);
  const domain = getDomain(domainId) ?? domains[0];
  const challenges = useMemo(() => getChallengesForDomain(domain.id), [domain.id]);

  const [mode, setMode] = useState<PracticeMode>(starter?.mode ?? "measure");
  const [formula, setFormula] = useState(
    starter ? "" : (EXAMPLES[startDomain.id]?.measure ?? "SUM(Sales[Quantity])")
  );
  const [targetTable, setTargetTable] = useState(
    starter?.targetTable ??
      EXAMPLES[startDomain.id]?.columnTable ??
      getFactTable(startDomain).name
  );
  const [sideTab, setSideTab] = useState<SideTab>(starter ? "challenge" : "data");
  const [resultText, setResultText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [columnPreview, setColumnPreview] = useState<string[] | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(starter);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);

  function applyChallenge(ch: Challenge) {
    setActiveChallenge(ch);
    setDomainId(ch.domainId);
    setMode(ch.mode);
    setFormula("");
    if (ch.targetTable) setTargetTable(ch.targetTable);
    setShowHint(false);
    setShowSolution(false);
    setCheckMsg(null);
    setResultText(null);
    setError(null);
    setColumnPreview(null);
    setSideTab("challenge");
  }

  const onDomainChange = (id: string) => {
    setDomainId(id);
    const ex = EXAMPLES[id];
    const d = getDomain(id);
    if (!d) return;
    setMode("measure");
    setFormula(ex?.measure ?? "");
    setTargetTable(ex?.columnTable ?? getFactTable(d).name);
    setActiveChallenge(null);
    setResultText(null);
    setError(null);
    setColumnPreview(null);
    setCheckMsg(null);
    setSideTab("data");
  };

  const run = () => {
    setCheckMsg(null);
    if (mode === "measure") {
      const out = evaluateMeasure(formula, domain);
      if (!out.ok) {
        setError(out.error);
        setResultText(null);
        setColumnPreview(null);
        return;
      }
      setError(null);
      setResultText(out.display);
      setColumnPreview(null);
      if (activeChallenge?.mode === "measure" && activeChallenge.expectedValue !== undefined) {
        const tol = activeChallenge.tolerance ?? 0.01;
        const ok =
          typeof out.value === "number" &&
          Math.abs(out.value - activeChallenge.expectedValue) <= tol;
        setCheckMsg(ok ? "Correct — matches the expected result." : "Ran successfully, but the value does not match the challenge yet.");
      }
      return;
    }

    const out = evaluateCalculatedColumn(formula, domain, targetTable);
    if (!out.ok) {
      setError(out.error);
      setResultText(null);
      setColumnPreview(null);
      return;
    }
    setError(null);
    setResultText(out.display);
    setColumnPreview((out.columnValues ?? []).map((v) => (v === null ? "BLANK" : String(v))));

    if (activeChallenge?.mode === "column" && activeChallenge.solution) {
      const expected = evaluateCalculatedColumn(activeChallenge.solution, domain, targetTable);
      if (
        expected.ok &&
        out.columnValues &&
        expected.columnValues &&
        out.columnValues.length === expected.columnValues.length &&
        out.columnValues.every((v, i) => v === expected.columnValues![i])
      ) {
        setCheckMsg("Correct — column values match the solution.");
      } else {
        setCheckMsg("Ran successfully, but values do not match the expected column yet.");
      }
    }
  };

  const loadExample = () => {
    const ex = EXAMPLES[domain.id];
    if (!ex) return;
    if (mode === "measure") setFormula(ex.measure);
    else {
      setFormula(ex.column);
      setTargetTable(ex.columnTable);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            DAX Lab
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-muted)]">
            Pick a domain, inspect the model, then write measures or calculated columns against sample data.
          </p>
        </div>
        <button
          type="button"
          onClick={loadExample}
          className="self-start rounded-md border border-[var(--ink)]/15 bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--teal)]/50"
        >
          Load example formula
        </button>
      </div>

      <DomainPicker domains={domains} value={domain.id} onChange={onDomainChange} />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Editor panel */}
        <section className="flex min-h-[420px] flex-col rounded-2xl border border-[var(--ink)]/10 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-[var(--mist)] p-0.5">
              {(["measure", "column"] as PracticeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    const ex = EXAMPLES[domain.id];
                    if (m === "measure") setFormula(ex?.measure ?? formula);
                    else {
                      setFormula(ex?.column ?? formula);
                      if (ex) setTargetTable(ex.columnTable);
                    }
                    setResultText(null);
                    setError(null);
                    setCheckMsg(null);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    mode === m ? "bg-[var(--teal)] text-white" : "text-[var(--ink-muted)]"
                  }`}
                >
                  {m === "measure" ? "Measure" : "Calculated column"}
                </button>
              ))}
            </div>
            {mode === "column" && (
              <label className="ml-auto flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                Table
                <select
                  value={targetTable}
                  onChange={(e) => setTargetTable(e.target.value)}
                  className="rounded-md border border-[var(--ink)]/15 bg-white px-2 py-1 text-xs text-[var(--ink)]"
                >
                  {domain.tables.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <label className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            Formula
          </label>
          <textarea
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            spellCheck={false}
            className="min-h-[140px] flex-1 resize-y rounded-xl border border-[var(--ink)]/10 bg-[var(--ink)]/[0.02] p-3 font-mono text-sm leading-relaxed text-[var(--ink)] outline-none ring-[var(--teal)] focus:ring-2"
            placeholder={
              mode === "measure"
                ? "SUM(Sales[Quantity])"
                : "RELATED(Products[Category])"
            }
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={run}
              className="rounded-lg bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--teal-dark)]"
            >
              Run
            </button>
            <span className="text-xs text-[var(--ink-muted)]">
              Subset DAX engine · teaching fidelity, not Power BI Desktop parity
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--ink)]/8 bg-[var(--mist)]/60 p-3">
            <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
              Result
            </div>
            {error ? (
              <p className="mt-1 text-sm text-red-700">{error}</p>
            ) : resultText ? (
              <p className="mt-1 font-mono text-lg text-[var(--ink)]">{resultText}</p>
            ) : (
              <p className="mt-1 text-sm text-[var(--ink-muted)]">Press Run to evaluate.</p>
            )}
            {checkMsg && (
              <p
                className={`mt-2 text-sm ${
                  checkMsg.startsWith("Correct") ? "text-[var(--teal)]" : "text-amber-800"
                }`}
              >
                {checkMsg}
              </p>
            )}
            {columnPreview && (
              <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-[var(--ink)]/10 bg-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[var(--mist)]">
                      <th className="px-2 py-1">#</th>
                      <th className="px-2 py-1">New column</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columnPreview.map((v, i) => (
                      <tr key={i} className="border-t border-[var(--ink)]/5">
                        <td className="px-2 py-1 text-[var(--ink-muted)]">{i + 1}</td>
                        <td className="px-2 py-1 font-mono">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Side panel */}
        <section className="flex min-h-[420px] flex-col rounded-2xl border border-[var(--ink)]/10 bg-white/80 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex flex-wrap gap-1">
            {(
              [
                ["data", "Data"],
                ["model", "Model"],
                ["functions", "Functions"],
                ["challenge", "Challenge"],
              ] as [SideTab, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSideTab(id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  sideTab === id
                    ? "bg-[var(--ink)] text-white"
                    : "text-[var(--ink-muted)] hover:bg-[var(--ink)]/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {sideTab === "data" && <DataBrowser key={domain.id} domain={domain} />}
            {sideTab === "model" && <ModelView domain={domain} />}
            {sideTab === "functions" && (
              <div>
                <p className="mb-3 text-sm text-[var(--ink-muted)]">
                  Supported in this practice engine:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPORTED_FUNCTIONS.map((fn) => (
                    <span
                      key={fn}
                      className="rounded-md bg-[var(--mist)] px-2 py-1 font-mono text-[11px] text-[var(--ink)]"
                    >
                      {fn}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {sideTab === "challenge" && (
              <div className="space-y-3">
                <label className="block text-xs text-[var(--ink-muted)]">
                  Select a challenge
                  <select
                    className="mt-1 w-full rounded-md border border-[var(--ink)]/15 bg-white px-2 py-2 text-sm text-[var(--ink)]"
                    value={activeChallenge?.id ?? ""}
                    onChange={(e) => {
                      const ch = challenges.find((c) => c.id === e.target.value);
                      if (ch) applyChallenge(ch);
                    }}
                  >
                    <option value="">Free practice</option>
                    {challenges.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.difficulty}] {c.title}
                      </option>
                    ))}
                  </select>
                </label>

                {activeChallenge ? (
                  <div className="space-y-3 rounded-xl bg-[var(--mist)]/70 p-3">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
                        {activeChallenge.title}
                      </h3>
                      <p className="text-xs capitalize text-[var(--ink-muted)]">
                        {activeChallenge.difficulty} · {activeChallenge.mode}
                        {activeChallenge.targetTable
                          ? ` · ${activeChallenge.targetTable}`
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--ink)]">{activeChallenge.prompt}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowHint((v) => !v)}
                        className="rounded-md border border-[var(--ink)]/15 bg-white px-2.5 py-1 text-xs"
                      >
                        {showHint ? "Hide hint" : "Show hint"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSolution((v) => !v)}
                        className="rounded-md border border-[var(--ink)]/15 bg-white px-2.5 py-1 text-xs"
                      >
                        {showSolution ? "Hide solution" : "Show solution"}
                      </button>
                    </div>
                    {showHint && (
                      <p className="text-sm text-[var(--teal-dark)]">{activeChallenge.hint}</p>
                    )}
                    {showSolution && (
                      <div>
                        <pre className="overflow-x-auto rounded-lg bg-[var(--ink)] p-3 font-mono text-xs text-teal-100">
                          {activeChallenge.solution}
                        </pre>
                        <p className="mt-2 text-sm text-[var(--ink-muted)]">
                          {activeChallenge.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--ink-muted)]">
                    Choose a challenge or stay in free practice and experiment freely.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
