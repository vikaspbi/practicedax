import type { Domain, TableDef } from "@/lib/types";
import { getTable } from "@/lib/domains";
import { DaxError } from "./tokenizer";
import { parse, type AstNode } from "./parser";

export type DaxValue = number | string | boolean | null;

export interface EvalResult {
  ok: true;
  value: DaxValue;
  /** For calculated columns: per-row results */
  columnValues?: DaxValue[];
  display: string;
}

export interface EvalFailure {
  ok: false;
  error: string;
}

export type EvaluateOutcome = EvalResult | EvalFailure;

interface FilterPredicate {
  table: string;
  column: string;
  op: string;
  value: DaxValue;
}

interface EvalContext {
  domain: Domain;
  /** Current row when evaluating a calculated column or iterator */
  rowTable?: string;
  row?: Record<string, DaxValue>;
  /** Extra filters from CALCULATE */
  filters: FilterPredicate[];
  /** Named measures defined in the session */
  measures: Record<string, string>;
}

function isBlank(v: DaxValue): boolean {
  return v === null || v === undefined || (typeof v === "number" && Number.isNaN(v));
}

function toNumber(v: DaxValue): number {
  if (isBlank(v)) return NaN;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function truthy(v: DaxValue): boolean {
  if (isBlank(v)) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  return String(v).length > 0;
}

function compare(op: string, left: DaxValue, right: DaxValue): boolean {
  if (op === "=") return left === right || (typeof left === "number" && typeof right === "number" && left === right);
  if (op === "<>") return left !== right;
  const a = toNumber(left);
  const b = toNumber(right);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    const as = String(left ?? "");
    const bs = String(right ?? "");
    if (op === "<") return as < bs;
    if (op === ">") return as > bs;
    if (op === "<=") return as <= bs;
    if (op === ">=") return as >= bs;
  }
  if (op === "<") return a < b;
  if (op === ">") return a > b;
  if (op === "<=") return a <= b;
  if (op === ">=") return a >= b;
  return false;
}

function formatValue(v: DaxValue): string {
  if (isBlank(v)) return "BLANK";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "NaN";
    return Number.isInteger(v) ? String(v) : v.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}

function getFilteredRows(ctx: EvalContext, tableName: string): Record<string, DaxValue>[] {
  const table = getTable(ctx.domain, tableName);
  if (!table) throw new DaxError(`Table '${tableName}' not found`);

  let rows = table.rows as Record<string, DaxValue>[];

  // Apply CALCULATE-style filters for this table
  const tableFilters = ctx.filters.filter((f) => f.table.toLowerCase() === tableName.toLowerCase());
  for (const f of tableFilters) {
    rows = rows.filter((r) => compare(f.op, r[f.column] as DaxValue, f.value));
  }

  // Propagate filters from related dimension tables via relationships
  for (const f of ctx.filters) {
    if (f.table.toLowerCase() === tableName.toLowerCase()) continue;
    const rel = ctx.domain.relationships.find(
      (r) =>
        r.fromTable.toLowerCase() === tableName.toLowerCase() &&
        r.toTable.toLowerCase() === f.table.toLowerCase()
    );
    if (!rel) continue;
    const dim = getTable(ctx.domain, f.table);
    if (!dim) continue;
    const matchingKeys = new Set(
      (dim.rows as Record<string, DaxValue>[])
        .filter((r) => compare(f.op, r[f.column] as DaxValue, f.value))
        .map((r) => r[rel.toColumn])
    );
    rows = rows.filter((r) => matchingKeys.has(r[rel.fromColumn]));
  }

  return rows;
}

function resolveColumn(
  ctx: EvalContext,
  table: string | undefined,
  column: string
): DaxValue {
  // Prefer explicit row context
  if (ctx.row) {
    if (table) {
      if (ctx.rowTable && table.toLowerCase() === ctx.rowTable.toLowerCase()) {
        if (!(column in ctx.row)) throw new DaxError(`Column ${table}[${column}] not found on current row`);
        return ctx.row[column] as DaxValue;
      }
      // RELATED path: look up via relationship from current row table
      return relatedLookup(ctx, table, column);
    }
    if (column in ctx.row) return ctx.row[column] as DaxValue;
  }

  if (!table) throw new DaxError(`Ambiguous column [${column}] — use Table[Column]`);

  // Outside row context: aggregating a single column needs an aggregator
  throw new DaxError(
    `Cannot read ${table}[${column}] without row context. Use SUM(${table}[${column}]) or an iterator.`
  );
}

function relatedLookup(ctx: EvalContext, targetTable: string, column: string): DaxValue {
  if (!ctx.row || !ctx.rowTable) throw new DaxError("RELATED requires row context");

  const rel = ctx.domain.relationships.find(
    (r) =>
      r.fromTable.toLowerCase() === ctx.rowTable!.toLowerCase() &&
      r.toTable.toLowerCase() === targetTable.toLowerCase()
  );
  if (!rel) {
    throw new DaxError(
      `No relationship from ${ctx.rowTable} to ${targetTable} for RELATED(${targetTable}[${column}])`
    );
  }

  const dim = getTable(ctx.domain, targetTable);
  if (!dim) throw new DaxError(`Table '${targetTable}' not found`);
  const key = ctx.row[rel.fromColumn];
  const match = (dim.rows as Record<string, DaxValue>[]).find((r) => r[rel.toColumn] === key);
  if (!match) return null;
  if (!(column in match)) throw new DaxError(`Column ${targetTable}[${column}] not found`);
  return match[column] as DaxValue;
}

function evalNode(node: AstNode, ctx: EvalContext): DaxValue {
  switch (node.kind) {
    case "number":
      return node.value;
    case "string":
      return node.value;
    case "boolean":
      return node.value;
    case "blank":
      return null;
    case "column":
      return resolveColumn(ctx, node.table, node.column);
    case "measure": {
      // Bare [Column] in row context → column; else named measure
      if (ctx.row && node.name in ctx.row) return ctx.row[node.name] as DaxValue;
      const formula = ctx.measures[node.name];
      if (!formula) {
        // Try as column on current table
        if (ctx.row && ctx.rowTable) {
          const t = getTable(ctx.domain, ctx.rowTable);
          if (t?.columns.some((c) => c.name === node.name)) {
            return ctx.row[node.name] as DaxValue;
          }
        }
        throw new DaxError(`Unknown measure or column [${node.name}]`);
      }
      return evalNode(parse(formula), ctx);
    }
    case "identifier":
      throw new DaxError(`Unknown identifier '${node.name}'`);
    case "unary": {
      const v = evalNode(node.expr, ctx);
      if (node.op === "-") return -toNumber(v);
      if (node.op === "+") return toNumber(v);
      if (node.op === "!" || node.op === "NOT") return !truthy(v);
      throw new DaxError(`Unsupported unary operator ${node.op}`);
    }
    case "binary": {
      if (node.op === "&&" || node.op === "AND") {
        return truthy(evalNode(node.left, ctx)) && truthy(evalNode(node.right, ctx));
      }
      if (node.op === "||" || node.op === "OR") {
        return truthy(evalNode(node.left, ctx)) || truthy(evalNode(node.right, ctx));
      }
      const left = evalNode(node.left, ctx);
      const right = evalNode(node.right, ctx);
      if (node.op === "&") return `${formatValue(left) === "BLANK" ? "" : left}${formatValue(right) === "BLANK" ? "" : right}`;
      if (["=", "<>", "<", ">", "<=", ">="].includes(node.op)) return compare(node.op, left, right);
      const a = toNumber(left);
      const b = toNumber(right);
      if (node.op === "+") return a + b;
      if (node.op === "-") return a - b;
      if (node.op === "*") return a * b;
      if (node.op === "/") return b === 0 ? null : a / b;
      throw new DaxError(`Unsupported operator ${node.op}`);
    }
    case "call":
      return evalCall(node.name, node.args, ctx);
    default:
      throw new DaxError("Unsupported expression");
  }
}

function requireColumnArg(arg: AstNode, fn: string): { table: string; column: string } {
  if (arg.kind !== "column" || !arg.table) {
    throw new DaxError(`${fn}() expects a column reference like Table[Column]`);
  }
  return { table: arg.table, column: arg.column };
}

function aggregate(
  ctx: EvalContext,
  table: string,
  column: string,
  fn: (nums: number[]) => DaxValue
): DaxValue {
  const rows = getFilteredRows(ctx, table);
  const nums = rows
    .map((r) => r[column])
    .filter((v) => !isBlank(v as DaxValue))
    .map((v) => toNumber(v as DaxValue))
    .filter((n) => !Number.isNaN(n));
  return fn(nums);
}

function evalIterator(
  ctx: EvalContext,
  tableArg: AstNode,
  expr: AstNode,
  reducer: (values: DaxValue[]) => DaxValue
): DaxValue {
  let tableName: string;
  let rows: Record<string, DaxValue>[];

  if (tableArg.kind === "identifier") {
    tableName = tableArg.name;
    rows = getFilteredRows(ctx, tableName);
  } else if (tableArg.kind === "call" && tableArg.name === "FILTER") {
    const filtered = evalFilter(tableArg.args, ctx);
    tableName = filtered.tableName;
    rows = filtered.rows;
  } else {
    throw new DaxError("Iterator first argument must be a table name or FILTER(...)");
  }

  const values: DaxValue[] = [];
  for (const row of rows) {
    const child: EvalContext = { ...ctx, rowTable: tableName, row };
    values.push(evalNode(expr, child));
  }
  return reducer(values);
}

function evalFilter(
  args: AstNode[],
  ctx: EvalContext
): { tableName: string; rows: Record<string, DaxValue>[] } {
  if (args.length !== 2) throw new DaxError("FILTER(table, condition) expects 2 arguments");
  if (args[0].kind !== "identifier") throw new DaxError("FILTER first argument must be a table name");
  const tableName = args[0].name;
  const rows = getFilteredRows(ctx, tableName);
  const out: Record<string, DaxValue>[] = [];
  for (const row of rows) {
    const child: EvalContext = { ...ctx, rowTable: tableName, row };
    if (truthy(evalNode(args[1], child))) out.push(row);
  }
  return { tableName, rows: out };
}

function parseFilterPredicate(arg: AstNode, ctx: EvalContext): FilterPredicate {
  // Supports: Table[Col] = "x"  or  Table[Col] = 1
  if (arg.kind === "binary" && ["=", "<>", "<", ">", "<=", ">="].includes(arg.op)) {
    if (arg.left.kind === "column" && arg.left.table) {
      return {
        table: arg.left.table,
        column: arg.left.column,
        op: arg.op,
        value: evalNode(arg.right, { ...ctx, row: undefined, rowTable: undefined }),
      };
    }
  }
  throw new DaxError(
    "CALCULATE filter must look like Table[Column] = \"value\". Complex filters are not supported yet."
  );
}

function evalCall(name: string, args: AstNode[], ctx: EvalContext): DaxValue {
  const n = name.toUpperCase();

  if (n === "SUM") {
    if (args.length !== 1) throw new DaxError("SUM expects 1 argument");
    const { table, column } = requireColumnArg(args[0], "SUM");
    return aggregate(ctx, table, column, (nums) => nums.reduce((a, b) => a + b, 0));
  }
  if (n === "AVERAGE" || n === "AVERAGEX" && false) {
    if (args.length !== 1) throw new DaxError("AVERAGE expects 1 argument");
    const { table, column } = requireColumnArg(args[0], "AVERAGE");
    return aggregate(ctx, table, column, (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null));
  }
  if (n === "MIN") {
    if (args.length !== 1) throw new DaxError("MIN expects 1 argument");
    const { table, column } = requireColumnArg(args[0], "MIN");
    return aggregate(ctx, table, column, (nums) => (nums.length ? Math.min(...nums) : null));
  }
  if (n === "MAX") {
    if (args.length !== 1) throw new DaxError("MAX expects 1 argument");
    const { table, column } = requireColumnArg(args[0], "MAX");
    return aggregate(ctx, table, column, (nums) => (nums.length ? Math.max(...nums) : null));
  }
  if (n === "COUNT" || n === "COUNTA") {
    if (args.length !== 1) throw new DaxError("COUNT expects 1 argument");
    const { table, column } = requireColumnArg(args[0], "COUNT");
    const rows = getFilteredRows(ctx, table);
    return rows.filter((r) => !isBlank(r[column] as DaxValue)).length;
  }
  if (n === "DISTINCTCOUNT") {
    if (args.length !== 1) throw new DaxError("DISTINCTCOUNT expects 1 argument");
    const { table, column } = requireColumnArg(args[0], "DISTINCTCOUNT");
    const rows = getFilteredRows(ctx, table);
    return new Set(rows.map((r) => r[column]).filter((v) => !isBlank(v as DaxValue))).size;
  }
  if (n === "COUNTROWS") {
    if (args.length !== 1) throw new DaxError("COUNTROWS expects a table name");
    if (args[0].kind === "identifier") {
      return getFilteredRows(ctx, args[0].name).length;
    }
    if (args[0].kind === "call" && args[0].name === "FILTER") {
      return evalFilter(args[0].args, ctx).rows.length;
    }
    throw new DaxError("COUNTROWS expects a table name or FILTER(...)");
  }

  if (n === "SUMX") {
    if (args.length !== 2) throw new DaxError("SUMX(table, expression) expects 2 arguments");
    return evalIterator(ctx, args[0], args[1], (vals) =>
      vals.reduce<number>((a, v) => a + (isBlank(v) ? 0 : toNumber(v)), 0)
    );
  }
  if (n === "AVERAGEX") {
    if (args.length !== 2) throw new DaxError("AVERAGEX(table, expression) expects 2 arguments");
    return evalIterator(ctx, args[0], args[1], (vals) => {
      const nums = vals.filter((v) => !isBlank(v)).map(toNumber);
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    });
  }
  if (n === "COUNTX") {
    if (args.length !== 2) throw new DaxError("COUNTX(table, expression) expects 2 arguments");
    return evalIterator(ctx, args[0], args[1], (vals) => vals.filter((v) => !isBlank(v)).length);
  }
  if (n === "MAXX") {
    if (args.length !== 2) throw new DaxError("MAXX(table, expression) expects 2 arguments");
    return evalIterator(ctx, args[0], args[1], (vals) => {
      const nums = vals.filter((v) => !isBlank(v)).map(toNumber);
      return nums.length ? Math.max(...nums) : null;
    });
  }
  if (n === "MINX") {
    if (args.length !== 2) throw new DaxError("MINX(table, expression) expects 2 arguments");
    return evalIterator(ctx, args[0], args[1], (vals) => {
      const nums = vals.filter((v) => !isBlank(v)).map(toNumber);
      return nums.length ? Math.min(...nums) : null;
    });
  }

  if (n === "FILTER") {
    throw new DaxError("FILTER must be used inside an iterator or COUNTROWS");
  }

  if (n === "CALCULATE") {
    if (args.length < 1) throw new DaxError("CALCULATE expects at least an expression");
    const filters = args.slice(1).map((a) => parseFilterPredicate(a, ctx));
    const child: EvalContext = { ...ctx, filters: [...ctx.filters, ...filters] };
    return evalNode(args[0], child);
  }

  if (n === "RELATED") {
    if (args.length !== 1) throw new DaxError("RELATED expects Table[Column]");
    const col = args[0];
    if (col.kind !== "column" || !col.table) throw new DaxError("RELATED expects Table[Column]");
    return relatedLookup(ctx, col.table, col.column);
  }

  if (n === "DIVIDE") {
    if (args.length < 2 || args.length > 3) throw new DaxError("DIVIDE(numerator, denominator[, alternate])");
    const num = toNumber(evalNode(args[0], ctx));
    const den = toNumber(evalNode(args[1], ctx));
    if (den === 0 || Number.isNaN(den) || Number.isNaN(num)) {
      return args[2] ? evalNode(args[2], ctx) : null;
    }
    return num / den;
  }

  if (n === "IF") {
    if (args.length < 2 || args.length > 3) throw new DaxError("IF(condition, true[, false])");
    if (truthy(evalNode(args[0], ctx))) return evalNode(args[1], ctx);
    return args[2] ? evalNode(args[2], ctx) : null;
  }

  if (n === "AND") {
    if (args.length !== 2) throw new DaxError("AND expects 2 arguments");
    return truthy(evalNode(args[0], ctx)) && truthy(evalNode(args[1], ctx));
  }
  if (n === "OR") {
    if (args.length !== 2) throw new DaxError("OR expects 2 arguments");
    return truthy(evalNode(args[0], ctx)) || truthy(evalNode(args[1], ctx));
  }
  if (n === "NOT") {
    if (args.length !== 1) throw new DaxError("NOT expects 1 argument");
    return !truthy(evalNode(args[0], ctx));
  }
  if (n === "ISBLANK") {
    if (args.length !== 1) throw new DaxError("ISBLANK expects 1 argument");
    return isBlank(evalNode(args[0], ctx));
  }
  if (n === "BLANK") {
    return null;
  }
  if (n === "ABS") {
    if (args.length !== 1) throw new DaxError("ABS expects 1 argument");
    return Math.abs(toNumber(evalNode(args[0], ctx)));
  }
  if (n === "ROUND") {
    if (args.length !== 2) throw new DaxError("ROUND(number, digits)");
    const value = toNumber(evalNode(args[0], ctx));
    const digits = toNumber(evalNode(args[1], ctx));
    const f = 10 ** digits;
    return Math.round(value * f) / f;
  }
  if (n === "INT") {
    if (args.length !== 1) throw new DaxError("INT expects 1 argument");
    return Math.trunc(toNumber(evalNode(args[0], ctx)));
  }
  if (n === "CONCATENATE") {
    if (args.length !== 2) throw new DaxError("CONCATENATE expects 2 arguments");
    const a = evalNode(args[0], ctx);
    const b = evalNode(args[1], ctx);
    return `${isBlank(a) ? "" : a}${isBlank(b) ? "" : b}`;
  }
  if (n === "UPPER") {
    if (args.length !== 1) throw new DaxError("UPPER expects 1 argument");
    const v = evalNode(args[0], ctx);
    return isBlank(v) ? null : String(v).toUpperCase();
  }
  if (n === "LOWER") {
    if (args.length !== 1) throw new DaxError("LOWER expects 1 argument");
    const v = evalNode(args[0], ctx);
    return isBlank(v) ? null : String(v).toLowerCase();
  }
  if (n === "SELECTEDVALUE") {
    // Simplified: if exactly one distinct value under filters, return it
    if (args.length < 1) throw new DaxError("SELECTEDVALUE expects a column");
    const { table, column } = requireColumnArg(args[0], "SELECTEDVALUE");
    const rows = getFilteredRows(ctx, table);
    const distinct = [...new Set(rows.map((r) => r[column]))];
    if (distinct.length === 1) return distinct[0] as DaxValue;
    return args[1] ? evalNode(args[1], ctx) : null;
  }
  if (n === "VALUES" || n === "ALL") {
    throw new DaxError(`${n}() table functions are not fully supported in this practice engine yet`);
  }

  throw new DaxError(`Function ${n}() is not supported in PracticeDAX yet`);
}

export function evaluateMeasure(
  formula: string,
  domain: Domain,
  measures: Record<string, string> = {}
): EvaluateOutcome {
  try {
    const ast = parse(formula);
    const value = evalNode(ast, { domain, filters: [], measures });
    return { ok: true, value, display: formatValue(value) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function evaluateCalculatedColumn(
  formula: string,
  domain: Domain,
  targetTable: string
): EvaluateOutcome {
  try {
    const table = getTable(domain, targetTable);
    if (!table) return { ok: false, error: `Table '${targetTable}' not found` };
    const ast = parse(formula);
    const columnValues: DaxValue[] = [];
    for (const row of table.rows as Record<string, DaxValue>[]) {
      const value = evalNode(ast, {
        domain,
        filters: [],
        measures: {},
        rowTable: table.name,
        row,
      });
      columnValues.push(value);
    }
    const preview = columnValues.slice(0, 5).map(formatValue).join(", ");
    return {
      ok: true,
      value: columnValues.length,
      columnValues,
      display: `${columnValues.length} rows → ${preview}${columnValues.length > 5 ? ", …" : ""}`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function getFactTable(domain: Domain): TableDef {
  return domain.tables.find((t) => t.isFact) ?? domain.tables[0];
}

export const SUPPORTED_FUNCTIONS = [
  "SUM", "AVERAGE", "MIN", "MAX", "COUNT", "COUNTA", "DISTINCTCOUNT", "COUNTROWS",
  "SUMX", "AVERAGEX", "COUNTX", "MINX", "MAXX", "FILTER",
  "CALCULATE", "RELATED", "DIVIDE", "IF", "AND", "OR", "NOT",
  "ISBLANK", "BLANK", "ABS", "ROUND", "INT", "CONCATENATE", "UPPER", "LOWER",
  "SELECTEDVALUE",
];
