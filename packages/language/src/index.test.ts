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
});
