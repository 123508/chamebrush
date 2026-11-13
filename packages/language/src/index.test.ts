import { describe, expect, test } from "vitest";
import { parse } from "./index";

describe("parser recovery", () => {
  test("keeps parsing after multiple malformed commands", () => {
    const result = parse(`canvas main {
  size (, 100)
  rect card {
    at (, 20)
    size (20, )
  }
}`);
    expect(result.document).toBeDefined();
    expect(result.diagnostics.length).toBeGreaterThanOrEqual(2);
  });

  test("rejects kebab-case declaration names", () => {
    const result = parse("let bad-name 1\ncanvas main { size (10, 10) }");
    expect(result.diagnostics[0]?.message).toContain("不能包含连字符");
  });

  test("reports a kebab-case nested object name without losing the enclosing structure", () => {
    const result = parse(`canvas main {
  size (100, 100)
  ellipse leg-front {
    center (50, 50)
    radius-x 10
    radius-y 20
  }
}`);

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.message).toContain("不能包含连字符");
    expect(result.document?.members).toHaveLength(1);
    const canvas = result.document?.members[0];
    expect(canvas?.kind).toBe("object");
    if (canvas?.kind !== "object") throw new Error("expected canvas object");
    expect(canvas.members.some((member) => member.kind === "object" && member.name === "leg-front")).toBe(true);
  });

  test("recovers from an unexpected top-level closing brace", () => {
    const result = parse("}\ncanvas main { size (10, 10) }");

    expect(result.diagnostics).toHaveLength(1);
    expect(result.document?.members.some((member) => member.kind === "object" && member.name === "main")).toBe(true);
  });
});
