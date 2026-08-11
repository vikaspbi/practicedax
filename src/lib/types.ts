export type ColumnType = "string" | "number" | "date" | "boolean";

export interface ColumnDef {
  name: string;
  type: ColumnType;
  description?: string;
}

export interface TableDef {
  name: string;
  description: string;
  isFact?: boolean;
  columns: ColumnDef[];
  rows: Record<string, string | number | boolean | null>[];
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  description?: string;
}

export interface Domain {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  tables: TableDef[];
  relationships: Relationship[];
}

export type PracticeMode = "measure" | "column";

export interface Challenge {
  id: string;
  domainId: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  mode: PracticeMode;
  /** Table for calculated column challenges */
  targetTable?: string;
  prompt: string;
  hint: string;
  solution: string;
  explanation: string;
  /** Optional expected numeric value for auto-check (measures) */
  expectedValue?: number;
  tolerance?: number;
}

export interface Concept {
  slug: string;
  title: string;
  summary: string;
  level: "fundamentals" | "core" | "advanced";
  readingMinutes: number;
  sections: { heading: string; body: string }[];
  tryPrompt?: string;
  relatedChallengeIds?: string[];
}
