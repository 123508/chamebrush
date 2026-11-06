import { describe, expect, test } from "vitest";
import { parseArguments } from "./options";

describe("parseArguments", () => {
  test("parses the render command with machine-readable output", () => {
    expect(parseArguments(["render", "drawing.chame", "-o", "drawing.svg", "--canvas", "main", "--json"])).toEqual({
      input: "drawing.chame",
      output: "drawing.svg",
      canvas: "main",
      scale: 1,
      json: true,
    });
  });

  test("keeps the repository shorthand compatible with --json", () => {
    expect(parseArguments(["drawing.chame", "drawing.svg", "--json"])).toEqual({
      input: "drawing.chame",
      output: "drawing.svg",
      scale: 1,
      json: true,
    });
  });

  test("rejects invalid scales and unknown flags", () => {
    expect(parseArguments(["render", "drawing.chame", "-o", "drawing.png", "--scale", "0"])).toBeUndefined();
    expect(parseArguments(["render", "drawing.chame", "-o", "drawing.svg", "--unknown"])).toBeUndefined();
  });
});
