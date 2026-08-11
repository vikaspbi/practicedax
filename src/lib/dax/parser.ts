import { DaxError, type Token, tokenize } from "./tokenizer";

export type AstNode =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "blank" }
  | { kind: "column"; table?: string; column: string }
  | { kind: "measure"; name: string }
  | { kind: "identifier"; name: string }
  | { kind: "unary"; op: string; expr: AstNode }
  | { kind: "binary"; op: string; left: AstNode; right: AstNode }
  | { kind: "call"; name: string; args: AstNode[] };

export function parse(input: string): AstNode {
  const tokens = tokenize(input);
  let pos = 0;

  const current = () => tokens[pos];
  const eat = (type?: Token["type"], value?: string) => {
    const t = current();
    if (type && t.type !== type) {
      throw new DaxError(`Expected ${type}, got ${t.type} (${t.value})`);
    }
    if (value !== undefined && t.value.toUpperCase() !== value.toUpperCase()) {
      throw new DaxError(`Expected ${value}, got ${t.value}`);
    }
    pos++;
    return t;
  };

  function parseExpression(): AstNode {
    return parseOr();
  }

  function parseOr(): AstNode {
    let left = parseAnd();
    while (
      (current().type === "op" && (current().value === "||" || current().value === "|")) ||
      (current().type === "identifier" && current().value.toUpperCase() === "OR")
    ) {
      const op = current().type === "identifier" ? "OR" : current().value;
      eat();
      const right = parseAnd();
      left = { kind: "binary", op: op === "|" || op === "||" ? "||" : "OR", left, right };
    }
    return left;
  }

  function parseAnd(): AstNode {
    let left = parseEquality();
    while (
      (current().type === "op" && (current().value === "&&" || current().value === "&")) ||
      (current().type === "identifier" && current().value.toUpperCase() === "AND")
    ) {
      const op = current().type === "identifier" ? "AND" : current().value;
      eat();
      // Single & is concatenate in DAX; && and AND are logical
      if (op === "&") {
        const right = parseEquality();
        left = { kind: "binary", op: "&", left, right };
      } else {
        const right = parseEquality();
        left = { kind: "binary", op: "&&", left, right };
      }
    }
    return left;
  }

  function parseEquality(): AstNode {
    let left = parseComparison();
    while (current().type === "op" && (current().value === "=" || current().value === "<>")) {
      const op = eat().value;
      const right = parseComparison();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  function parseComparison(): AstNode {
    let left = parseAdd();
    while (current().type === "op" && ["<", ">", "<=", ">="].includes(current().value)) {
      const op = eat().value;
      const right = parseAdd();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  function parseAdd(): AstNode {
    let left = parseMul();
    while (current().type === "op" && (current().value === "+" || current().value === "-")) {
      const op = eat().value;
      const right = parseMul();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  function parseMul(): AstNode {
    let left = parseUnary();
    while (current().type === "op" && (current().value === "*" || current().value === "/")) {
      const op = eat().value;
      const right = parseUnary();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  function parseUnary(): AstNode {
    if (current().type === "op" && (current().value === "-" || current().value === "+" || current().value === "!")) {
      const op = eat().value;
      return { kind: "unary", op, expr: parseUnary() };
    }
    if (current().type === "identifier" && current().value.toUpperCase() === "NOT") {
      eat();
      return { kind: "unary", op: "NOT", expr: parseUnary() };
    }
    return parsePrimary();
  }

  function parsePrimary(): AstNode {
    const t = current();

    if (t.type === "number") {
      eat();
      return { kind: "number", value: Number(t.value) };
    }
    if (t.type === "string") {
      eat();
      return { kind: "string", value: t.value };
    }
    if (t.type === "columnRef") {
      eat();
      return { kind: "column", table: t.table, column: t.column! };
    }
    if (t.type === "measureRef") {
      eat();
      return { kind: "measure", name: t.column! };
    }
    if (t.type === "identifier") {
      const name = eat().value;
      if (name.toUpperCase() === "TRUE") return { kind: "boolean", value: true };
      if (name.toUpperCase() === "FALSE") return { kind: "boolean", value: false };
      if (name.toUpperCase() === "BLANK") {
        if (current().type === "lparen") {
          eat("lparen");
          eat("rparen");
        }
        return { kind: "blank" };
      }
      if (current().type === "lparen") {
        eat("lparen");
        const args: AstNode[] = [];
        if (current().type !== "rparen") {
          args.push(parseExpression());
          while (current().type === "comma") {
            eat("comma");
            args.push(parseExpression());
          }
        }
        eat("rparen");
        return { kind: "call", name: name.toUpperCase(), args };
      }
      return { kind: "identifier", name };
    }
    if (t.type === "lparen") {
      eat("lparen");
      const expr = parseExpression();
      eat("rparen");
      return expr;
    }

    throw new DaxError(`Unexpected token: ${t.type} ${t.value}`);
  }

  const ast = parseExpression();
  if (current().type !== "eof") {
    throw new DaxError(`Unexpected token after expression: ${current().value}`);
  }
  return ast;
}
