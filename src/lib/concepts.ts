import type { Concept } from "@/lib/types";

export const concepts: Concept[] = [
  {
    slug: "measures-vs-columns",
    title: "Measures vs Calculated Columns",
    summary: "When to aggregate on the fly versus materialize a value per row.",
    level: "fundamentals",
    readingMinutes: 4,
    sections: [
      {
        heading: "Calculated columns",
        body: "A calculated column is computed row by row when the model refreshes (or when evaluated in PracticeDAX). It lives on a table, consumes memory per row, and is ideal for static labels, flags, or values that depend only on the current row (and RELATED columns).",
      },
      {
        heading: "Measures",
        body: "A measure is calculated at query time in filter context — whatever slicers, visuals, or CALCULATE filters are active. Measures are the right tool for totals, averages, ratios, and time intelligence.",
      },
      {
        heading: "Rule of thumb",
        body: "If you need a value that changes with filters (\"total sales for Bikes this quarter\"), use a measure. If you need a physical field on each row (\"product category on the sales line\"), use a column — or better, keep it in a dimension and relate.",
      },
    ],
    tryPrompt: "In the Sales lab, write both a Line Total column and a Gross Revenue measure.",
    relatedChallengeIds: ["sales-line-total-col", "sales-revenue"],
  },
  {
    slug: "row-vs-filter-context",
    title: "Row Context vs Filter Context",
    summary: "The two evaluation contexts that explain most DAX surprises.",
    level: "fundamentals",
    readingMinutes: 5,
    sections: [
      {
        heading: "Row context",
        body: "Row context means \"the current row.\" Calculated columns and iterators (SUMX, FILTER, etc.) create row context. Inside that context you can reference Sales[Quantity] and get that row’s value.",
      },
      {
        heading: "Filter context",
        body: "Filter context is the set of filters coming from visuals, slicers, and CALCULATE. Aggregators like SUM(Sales[Quantity]) respect filter context — they only see remaining rows.",
      },
      {
        heading: "Transition",
        body: "CALCULATE can turn row context into filter context (context transition). That is why measures inside iterators often behave differently than raw column references — a key advanced topic once basics feel solid.",
      },
    ],
    tryPrompt: "Compare Sales[Quantity] * Sales[UnitPrice] as a column vs SUMX as a measure.",
    relatedChallengeIds: ["sales-line-total-col", "sales-revenue"],
  },
  {
    slug: "calculate",
    title: "CALCULATE and Filter Context",
    summary: "The most important function in DAX — modify filters, then evaluate.",
    level: "core",
    readingMinutes: 5,
    sections: [
      {
        heading: "What CALCULATE does",
        body: "CALCULATE(expression, filters…) evaluates expression under a modified filter context. Filters can add, replace, or (with modifiers like ALL — not fully simulated here) remove filters.",
      },
      {
        heading: "Dimension filters",
        body: "Filtering a dimension column (Products[Category] = \"Bikes\") propagates across relationships to filter the fact table. Model relationships are what make this feel automatic.",
      },
      {
        heading: "Practice pattern",
        body: "Start with a base measure, then wrap it: CALCULATE([Total Qty], Products[Category] = \"Bikes\"). In PracticeDAX you can also inline SUM inside CALCULATE.",
      },
    ],
    tryPrompt: "Solve the Bike Quantity challenge in the Sales domain.",
    relatedChallengeIds: ["sales-bike-qty", "fin-revenue-actuals"],
  },
  {
    slug: "iterators",
    title: "Iterators (SUMX and friends)",
    summary: "Row-by-row expressions when a simple column SUM is not enough.",
    level: "core",
    readingMinutes: 4,
    sections: [
      {
        heading: "Why iterators exist",
        body: "SUM(Sales[Quantity]) only sums a stored column. Revenue = Quantity × Price is an expression per row — use SUMX(Sales, Sales[Quantity] * Sales[UnitPrice]).",
      },
      {
        heading: "FILTER + iterators",
        body: "SUMX(FILTER(Sales, Sales[Quantity] > 2), …) iterates a filtered table expression. PracticeDAX supports FILTER inside iterators and COUNTROWS.",
      },
      {
        heading: "Performance mindset",
        body: "In real Power BI, iterators over large tables can be expensive. Prefer relationships + CALCULATE when possible; use iterators when the math truly needs row-level expressions.",
      },
    ],
    tryPrompt: "Build Net Revenue with SUMX and Discount.",
    relatedChallengeIds: ["sales-net-revenue"],
  },
  {
    slug: "relationships",
    title: "Star Schema & Relationships",
    summary: "Fact tables, dimensions, and why RELATED works one way.",
    level: "fundamentals",
    readingMinutes: 4,
    sections: [
      {
        heading: "Star schema",
        body: "Facts hold events (sales lines, timesheets, actuals). Dimensions hold descriptive attributes (product, customer, account). Keep facts skinny; put labels on dimensions.",
      },
      {
        heading: "RELATED",
        body: "RELATED(Dim[Column]) works from the many side to the one side — e.g. from Sales to Products. Going the other way needs RELATEDTABLE or aggregators.",
      },
      {
        heading: "In PracticeDAX",
        body: "Each domain ships with explicit relationships. Open the Model tab in the lab to see how tables connect before you write RELATED or CALCULATE filters.",
      },
    ],
    tryPrompt: "Add Product Category onto Sales with RELATED.",
    relatedChallengeIds: ["sales-category-col", "hr-dept-name-col"],
  },
  {
    slug: "divide-and-safe-math",
    title: "DIVIDE and Safe Math",
    summary: "Avoid divide-by-zero surprises in ratios and margins.",
    level: "core",
    readingMinutes: 3,
    sections: [
      {
        heading: "DIVIDE",
        body: "DIVIDE(numerator, denominator[, alternate]) returns BLANK (or alternate) when the denominator is zero — cleaner than raw / for KPIs.",
      },
      {
        heading: "Typical ratios",
        body: "Margin % = DIVIDE([Profit], [Revenue]). Always decide what \"no revenue\" should show: blank, 0, or a placeholder.",
      },
    ],
    tryPrompt: "In free practice, try DIVIDE(SUM(Sales[Quantity]), DISTINCTCOUNT(Sales[CustomerID])).",
  },
];

export function getConcept(slug: string) {
  return concepts.find((c) => c.slug === slug);
}
