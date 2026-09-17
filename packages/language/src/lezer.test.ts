import { TreeFragment } from "@lezer/common";
import { classHighlighter, highlightTree } from "@lezer/highlight";
import { describe, expect, test } from "vitest";
import { chamebrushParser } from "./lezer";

function errors(source: string): string[] {
  const result: string[] = [];
  const cursor = chamebrushParser.parse(source).cursor();
  do {
    if (cursor.type.isError) result.push(`${cursor.from}:${cursor.to}`);
  } while (cursor.next());
  return result;
}

describe("Lezer parser", () => {
  test("parses declarations, expressions, comments, and multiline lists", () => {
    const source = `/* 场景 */
let gap 12
canvas 主画布 {
  size (320, 200)
  polygon shape {
    points [
      (10, 10)
      (gap * 2, 10)
      (20, 30)
    ]
    fill "#fff"
  }
}`;

    expect(errors(source)).toEqual([]);
    const tree = chamebrushParser.parse(source).toString();
    expect(tree).toContain("LetKeyword");
    expect(tree).toContain("ObjectDeclaration");
    expect(tree).toContain("CommandName");
    expect(tree).toContain("ListExpression");
  });

  test("keeps a recoverable tree for incomplete input", () => {
    const tree = chamebrushParser.parse("canvas main {\n  rect card {\n    size (20,");
    expect(tree.type.name).toBe("Document");
    expect(errors("canvas main {\n  rect card {\n    size (20,").length).toBeGreaterThan(0);
  });

  test("accepts old tree fragments during an incremental edit", () => {
    const before = "canvas main {\n  size (100, 80)\n  rect card {\n    size (20, 10)\n  }\n}";
    const from = before.indexOf("100");
    const after = `${before.slice(0, from)}120${before.slice(from + 3)}`;
    const fragments = TreeFragment.applyChanges(TreeFragment.addTree(chamebrushParser.parse(before)), [{
      fromA: from,
      toA: from + 3,
      fromB: from,
      toB: from + 3,
    }]);

    const tree = chamebrushParser.parse(after, fragments);
    expect(tree.length).toBe(after.length);
    expect(errors(after)).toEqual([]);
  });

  test("provides highlight tags for declarations, commands, and references", () => {
    const source = "let paper \"#fff\"\ncanvas main {\n  size (100, 80)\n  background paper\n  rect card { at (0, 0) }\n}";
    const highlighted = new Map<string, string>();
    highlightTree(chamebrushParser.parse(source), classHighlighter, (from, to, classes) => {
      highlighted.set(source.slice(from, to), classes);
    });
    for (const word of ["let", "canvas", "size", "background", "paper", "rect", "card", "at"]) {
      expect(highlighted.get(word), word).toBeDefined();
    }
  });
});
