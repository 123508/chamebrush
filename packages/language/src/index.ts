export { chamebrushParser } from "./lezer";

export interface SourceRange {
  from: number;
  to: number;
  line: number;
  column: number;
}

export interface Diagnostic {
  severity: "error" | "warning";
  message: string;
  range: SourceRange;
}

export type ValueNode =
  | NumberValue
  | StringValue
  | BooleanValue
  | ReferenceValue
  | TupleValue
  | ListValue
  | BinaryValue
  | UnaryValue;

export interface NumberValue {
  kind: "number";
  value: number;
  unit?: "px" | "%" | "deg";
  range: SourceRange;
}

export interface StringValue {
  kind: "string";
  value: string;
  range: SourceRange;
}

export interface BooleanValue {
  kind: "boolean";
  value: boolean;
  range: SourceRange;
}

export interface ReferenceValue {
  kind: "reference";
  path: string[];
  range: SourceRange;
}

export interface TupleValue {
  kind: "tuple";
  items: ValueNode[];
  range: SourceRange;
}

export interface ListValue {
  kind: "list";
  items: ValueNode[];
  range: SourceRange;
}

export interface BinaryValue {
  kind: "binary";
  operator: "+" | "-" | "*" | "/";
  left: ValueNode;
  right: ValueNode;
  range: SourceRange;
}

export interface UnaryValue {
  kind: "unary";
  operator: "+" | "-";
  value: ValueNode;
  range: SourceRange;
}

export interface LetNode {
  kind: "let";
  name: string;
  value: ValueNode;
  range: SourceRange;
}

export interface CommandNode {
  kind: "command";
  name: string;
  arguments: ValueNode[];
  range: SourceRange;
}

export interface ObjectNode {
  kind: "object";
  objectType: string;
  name: string;
  members: Array<LetNode | CommandNode | ObjectNode>;
  range: SourceRange;
}

export interface AnimationNode {
  kind: "animation";
  commands: CommandNode[];
  range: SourceRange;
}

export interface DocumentNode {
  kind: "document";
  members: Array<LetNode | ObjectNode | AnimationNode>;
  range: SourceRange;
}

export interface ParseResult {
  document?: DocumentNode;
  diagnostics: Diagnostic[];
}

type TokenType =
  | "identifier"
  | "number"
  | "string"
  | "newline"
  | "{"
  | "}"
  | "("
  | ")"
  | "["
  | "]"
  | ","
  | "."
  | "+"
  | "-"
  | "*"
  | "/"
  | "eof";

interface Token {
  type: TokenType;
  text: string;
  range: SourceRange;
}

class ParseError extends Error {
  constructor(
    message: string,
    readonly range: SourceRange,
  ) {
    super(message);
  }
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let line = 1;
  let column = 1;

  const rangeFrom = (from: number, startLine: number, startColumn: number): SourceRange => ({
    from,
    to: index,
    line: startLine,
    column: startColumn,
  });

  const advance = (): string => {
    const character = source[index] ?? "";
    index += 1;
    if (character === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
    return character;
  };

  const isIdentifierStart = (character: string): boolean => /[\p{L}_]/u.test(character);
  const isIdentifierContinue = (character: string): boolean => /[\p{L}\p{N}_-]/u.test(character);

  while (index < source.length) {
    const character = source[index] ?? "";
    const from = index;
    const startLine = line;
    const startColumn = column;

    if (character === " " || character === "\t") {
      advance();
      continue;
    }

    if (character === "\r" || character === "\n") {
      if (character === "\r") {
        advance();
        if (source[index] === "\n") advance();
      } else {
        advance();
      }
      tokens.push({ type: "newline", text: "\n", range: rangeFrom(from, startLine, startColumn) });
      continue;
    }

    if (character === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== "\n" && source[index] !== "\r") advance();
      continue;
    }

    if (character === "/" && source[index + 1] === "*") {
      advance();
      advance();
      let closed = false;
      while (index < source.length) {
        if (source[index] === "*" && source[index + 1] === "/") {
          advance();
          advance();
          closed = true;
          break;
        }
        advance();
      }
      if (!closed) throw new ParseError("未结束的多行注释", rangeFrom(from, startLine, startColumn));
      continue;
    }

    if (character === '"') {
      advance();
      let value = "";
      let closed = false;
      while (index < source.length) {
        const current = advance();
        if (current === '"') {
          closed = true;
          break;
        }
        if (current === "\\") {
          const escaped = advance();
          const replacements: Record<string, string> = {
            n: "\n",
            r: "\r",
            t: "\t",
            '"': '"',
            "\\": "\\",
          };
          value += replacements[escaped] ?? escaped;
        } else {
          value += current;
        }
      }
      if (!closed) throw new ParseError("未结束的字符串", rangeFrom(from, startLine, startColumn));
      tokens.push({ type: "string", text: value, range: rangeFrom(from, startLine, startColumn) });
      continue;
    }

    if (/[0-9]/.test(character) || (character === "." && /[0-9]/.test(source[index + 1] ?? ""))) {
      let text = "";
      while (/[0-9]/.test(source[index] ?? "")) text += advance();
      if (source[index] === ".") {
        text += advance();
        while (/[0-9]/.test(source[index] ?? "")) text += advance();
      }
      if (source.slice(index, index + 3) === "deg") {
        text += advance() + advance() + advance();
      } else if (source.slice(index, index + 2) === "px") {
        text += advance() + advance();
      } else if (source[index] === "%") {
        text += advance();
      }
      tokens.push({ type: "number", text, range: rangeFrom(from, startLine, startColumn) });
      continue;
    }

    if (isIdentifierStart(character)) {
      let text = advance();
      while (isIdentifierContinue(source[index] ?? "")) text += advance();
      tokens.push({ type: "identifier", text, range: rangeFrom(from, startLine, startColumn) });
      continue;
    }

    if ("{}()[],.+-*/".includes(character)) {
      advance();
      tokens.push({
        type: character as TokenType,
        text: character,
        range: rangeFrom(from, startLine, startColumn),
      });
      continue;
    }

    throw new ParseError(`无法识别的字符“${character}”`, rangeFrom(from, startLine, startColumn));
  }

  const eofRange = { from: index, to: index, line, column };
  tokens.push({ type: "eof", text: "", range: eofRange });
  return tokens;
}

class Parser {
  private position = 0;
  readonly diagnostics: Diagnostic[] = [];

  constructor(private readonly tokens: Token[]) {}

  parseDocument(): DocumentNode {
    const members: Array<LetNode | ObjectNode | AnimationNode> = [];
    this.skipNewlines();
    while (!this.check("eof")) {
      try {
        if (this.checkIdentifier("animation")) members.push(this.parseAnimation());
        else if (this.checkIdentifier("let")) members.push(this.parseLet());
        else members.push(this.parseObject());
      } catch (error) {
        if (!(error instanceof ParseError)) throw error;
        this.report(error);
        this.recoverLine();
        if (this.check("}")) this.advance();
      }
      this.skipNewlines();
    }
    const first = this.tokens[0]?.range ?? this.current().range;
    return {
      kind: "document",
      members,
      range: { ...first, to: this.current().range.to },
    };
  }

  private parseAnimation(): AnimationNode {
    const start = this.advance();
    this.consume("{", "animation 后需要“{”");
    const commands: CommandNode[] = [];
    this.skipNewlines();
    while (!this.check("}") && !this.check("eof")) {
      try {
        commands.push(this.parseCommand());
      } catch (error) {
        if (!(error instanceof ParseError)) throw error;
        this.report(error);
        this.recoverLine();
      }
      this.skipNewlines();
    }
    const end = this.consume("}", "animation 缺少“}”");
    this.match("newline");
    return { kind: "animation", commands, range: { ...start.range, to: end.range.to } };
  }

  private parseLet(): LetNode {
    const start = this.consumeIdentifier("应为 let");
    const name = this.consume("identifier", "let 后需要变量名");
    this.validateName(name);
    const value = this.parseExpression();
    this.finishLine("let 声明后存在多余内容");
    return {
      kind: "let",
      name: name.text,
      value,
      range: { ...start.range, to: value.range.to },
    };
  }

  private parseObject(): ObjectNode {
    const type = this.consume("identifier", "需要对象类型");
    const name = this.consume("identifier", `对象 ${type.text} 缺少名称`);
    this.validateName(name);
    this.consume("{", `对象 ${name.text} 后需要“{”`);
    this.match("newline");

    const members: Array<LetNode | CommandNode | ObjectNode> = [];
    this.skipNewlines();
    while (!this.check("}") && !this.check("eof")) {
      try {
        if (this.checkIdentifier("let")) {
          members.push(this.parseLet());
        } else if (this.isObjectAhead()) {
          members.push(this.parseObject());
        } else {
          members.push(this.parseCommand());
        }
      } catch (error) {
        if (!(error instanceof ParseError)) throw error;
        this.report(error);
        this.recoverLine();
      }
      this.skipNewlines();
    }

    const end = this.consume("}", `对象 ${name.text} 缺少“}”`);
    this.match("newline");
    return {
      kind: "object",
      objectType: type.text,
      name: name.text,
      members,
      range: { ...type.range, to: end.range.to },
    };
  }

  private parseCommand(): CommandNode {
    const name = this.consume("identifier", "需要命令名称");
    const args: ValueNode[] = [];
    while (!this.check("newline") && !this.check("}") && !this.check("eof")) {
      args.push(this.parseExpression());
    }
    const end = args.at(-1)?.range ?? name.range;
    if (this.check("newline")) this.advance();
    return {
      kind: "command",
      name: name.text,
      arguments: args,
      range: { ...name.range, to: end.to },
    };
  }

  private parseExpression(minPrecedence = 0): ValueNode {
    let left = this.parseUnary();
    const precedence: Partial<Record<TokenType, number>> = { "+": 1, "-": 1, "*": 2, "/": 2 };
    while (true) {
      const operator = this.current();
      const operatorPrecedence = precedence[operator.type];
      if (operatorPrecedence === undefined || operatorPrecedence < minPrecedence) break;
      this.advance();
      const right = this.parseExpression(operatorPrecedence + 1);
      left = {
        kind: "binary",
        operator: operator.type as BinaryValue["operator"],
        left,
        right,
        range: { ...left.range, to: right.range.to },
      };
    }
    return left;
  }

  private parseUnary(): ValueNode {
    if (this.check("+") || this.check("-")) {
      const operator = this.advance();
      const value = this.parseUnary();
      return {
        kind: "unary",
        operator: operator.type as UnaryValue["operator"],
        value,
        range: { ...operator.range, to: value.range.to },
      };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ValueNode {
    const token = this.current();
    if (this.match("number")) {
      const unit = token.text.endsWith("deg") ? "deg" : token.text.endsWith("px") ? "px" : token.text.endsWith("%") ? "%" : undefined;
      const numericText = unit ? token.text.slice(0, -unit.length) : token.text;
      const value: NumberValue = { kind: "number", value: Number(numericText), range: token.range };
      if (unit) value.unit = unit;
      return value;
    }
    if (this.match("string")) return { kind: "string", value: token.text, range: token.range };
    if (this.match("identifier")) {
      if (token.text === "true" || token.text === "false") {
        return { kind: "boolean", value: token.text === "true", range: token.range };
      }
      const path = [token.text];
      let end = token.range.to;
      while (this.match(".")) {
        const part = this.consume("identifier", "点号后需要名称");
        path.push(part.text);
        end = part.range.to;
      }
      return { kind: "reference", path, range: { ...token.range, to: end } };
    }
    if (this.match("(")) {
      const first = this.parseExpression();
      if (this.match(",")) {
        const second = this.parseExpression();
        const end = this.consume(")", "坐标元组缺少“)”");
        return {
          kind: "tuple",
          items: [first, second],
          range: { ...token.range, to: end.range.to },
        };
      }
      this.consume(")", "表达式缺少“)”");
      return first;
    }
    if (this.match("[")) {
      const items: ValueNode[] = [];
      this.skipNewlines();
      while (!this.check("]") && !this.check("eof")) {
        items.push(this.parseExpression());
        this.match(",");
        this.skipNewlines();
      }
      const end = this.consume("]", "列表缺少“]”");
      return { kind: "list", items, range: { ...token.range, to: end.range.to } };
    }
    throw new ParseError("这里需要一个值", token.range);
  }

  private isObjectAhead(): boolean {
    return this.current().type === "identifier"
      && this.peek(1).type === "identifier"
      && this.peek(2).type === "{";
  }

  private validateName(token: Token): void {
    if (token.text.includes("-")) {
      this.report(new ParseError("名称不能包含连字符，请使用 camelCase 或下划线", token.range));
    }
  }

  private finishLine(message: string): void {
    if (this.check("newline")) {
      this.advance();
      return;
    }
    if (this.check("eof") || this.check("}")) return;
    throw new ParseError(message, this.current().range);
  }

  private report(error: ParseError): void {
    this.diagnostics.push({ severity: "error", message: error.message, range: error.range });
  }

  private recoverLine(): void {
    while (!this.check("newline") && !this.check("}") && !this.check("eof")) this.advance();
    this.match("newline");
  }

  private consumeIdentifier(message: string): Token {
    return this.consume("identifier", message);
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new ParseError(message, this.current().range);
  }

  private match(type: TokenType): boolean {
    if (!this.check(type)) return false;
    this.advance();
    return true;
  }

  private check(type: TokenType): boolean {
    return this.current().type === type;
  }

  private checkIdentifier(text: string): boolean {
    return this.current().type === "identifier" && this.current().text === text;
  }

  private skipNewlines(): void {
    while (this.match("newline")) {
      // Intentionally empty.
    }
  }

  private advance(): Token {
    const token = this.current();
    if (token.type !== "eof") this.position += 1;
    return token;
  }

  private current(): Token {
    return this.tokens[this.position] ?? this.tokens[this.tokens.length - 1]!;
  }

  private peek(offset: number): Token {
    return this.tokens[this.position + offset] ?? this.tokens[this.tokens.length - 1]!;
  }
}

export function parse(source: string): ParseResult {
  try {
    const tokens = tokenize(source);
    const parser = new Parser(tokens);
    const document = parser.parseDocument();
    return { document, diagnostics: parser.diagnostics };
  } catch (error) {
    if (error instanceof ParseError) {
      return {
        diagnostics: [{ severity: "error", message: error.message, range: error.range }],
      };
    }
    throw error;
  }
}
