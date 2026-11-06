import { describe, expect, test } from "vitest";
import { renderChamebrush } from "./render";

describe("renderChamebrush", () => {
  test("returns source and SVG canvases for an MCP host", () => {
    const source = `canvas first { size (120, 80) }
canvas second { size (200, 100) }`;
    const result = renderChamebrush(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toBe(source);
    expect(result.canvases.map((canvas) => canvas.name)).toEqual(["first", "second"]);
    expect(result.canvases[0]?.svg).toContain("<svg");
    expect(result.canvases[1]).toMatchObject({ width: 200, height: 100, mimeType: "image/svg+xml" });
  });

  test("returns source-located diagnostics without an SVG", () => {
    const result = renderChamebrush(`canvas main {
  size (100, 100)
  rect missingSize { at (10, 10) }
}`);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]?.range.line).toBe(3);
    expect(result.diagnostics[0]?.message).toContain("size");
  });

  test("can select one canvas", () => {
    const result = renderChamebrush(`canvas first { size (120, 80) }
canvas second { size (200, 100) }`, "second");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.canvases.map((canvas) => canvas.name)).toEqual(["second"]);
  });

  test("preserves animation settings for viewer playback", () => {
    const result = renderChamebrush(`animation { fps 8 }
canvas first { size (120, 80) }
canvas second { size (200, 100) }`);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.animation).toEqual({ fps: 8 });
    expect(result.canvases).toHaveLength(2);
  });
});
