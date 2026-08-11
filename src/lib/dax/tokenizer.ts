export type TokenType =
  | "number"
  | "string"
  | "identifier"
  | "columnRef"
  | "measureRef"
  | "op"
  | "lparen"
  | "rparen"
  | "comma"
  | "eof";

export interface Token {
  type: TokenType;
  value: string;
  /** For columnRef: table name (optional) and column */
  table?: string;
  column?: string;
}

export class DaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DaxError";
  }
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.trim();

  const peek = () => src[i];
  const advance = () => src[i++];

  while (i < src.length) {
    const ch = peek();

    if (/\s/.test(ch)) {
      advance();
      continue;
    }

    // Line comments
    if (ch === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "lparen", value: "(" });
      advance();
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen", value: ")" });
      advance();
      continue;
    }
    if (ch === ",") {
      tokens.push({ type: "comma", value: "," });
      advance();
      continue;
    }

    // Operators (multi-char first)
    if (src.startsWith("<>", i) || src.startsWith("<=", i) || src.startsWith(">=", i) || src.startsWith("&&", i) || src.startsWith("||", i)) {
      const op = src.slice(i, i + 2);
      tokens.push({ type: "op", value: op });
      i += 2;
      continue;
    }
    if ("+-*/=<>&|!".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      advance();
      continue;
    }

    // String
    if (ch === '"') {
      advance();
      let s = "";
      while (i < src.length && peek() !== '"') {
        if (peek() === "\\" && i + 1 < src.length) {
          advance();
          s += advance();
        } else {
          s += advance();
        }
      }
      if (peek() !== '"') throw new DaxError('Unterminated string literal');
      advance();
      tokens.push({ type: "string", value: s });
      continue;
    }

    // Number
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      let n = "";
      while (i < src.length && /[0-9.]/.test(peek())) n += advance();
      tokens.push({ type: "number", value: n });
      continue;
    }

    // Identifier, Table[Column], [Column], [Measure]
    if (/[A-Za-z_]/.test(ch) || ch === "[") {
      // Table[Column] or bare identifier or [Name]
      if (ch === "[") {
        advance();
        let name = "";
        while (i < src.length && peek() !== "]") name += advance();
        if (peek() !== "]") throw new DaxError("Unterminated [ ] reference");
        advance();
        tokens.push({ type: "measureRef", value: name, column: name });
        continue;
      }

      let ident = "";
      while (i < src.length && /[A-Za-z0-9_]/.test(peek())) ident += advance();

      // Optional whitespace then [Column]
      let j = i;
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] === "[") {
        i = j + 1;
        let col = "";
        while (i < src.length && peek() !== "]") col += advance();
        if (peek() !== "]") throw new DaxError("Unterminated column reference");
        advance();
        tokens.push({ type: "columnRef", value: `${ident}[${col}]`, table: ident, column: col });
        continue;
      }

      tokens.push({ type: "identifier", value: ident });
      continue;
    }

    throw new DaxError(`Unexpected character: ${ch}`);
  }

  tokens.push({ type: "eof", value: "" });
  return tokens;
}
