import { expect, test } from "vitest";
import { compile } from "@chamebrush/core";
import { renderPreviewSvg, renderSvg } from "./index";

test("renders escaped SVG", () => {
  const result = compile(`canvas main {
  size (320, 180)
  text title {
    content "A < B & C"
    at (160, 90)
    align center
  }
}`);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const svg = renderSvg(result.scene);
  expect(svg).toContain("A &lt; B &amp; C");
  expect(svg).toContain('viewBox="0 0 320 180"');
});

test("adds hit targets only to the interactive preview", () => {
  const result = compile(`canvas main {
  size (100, 80)
  group layer {
    line edge {
      from (10, 20)
      to (90, 20)
      translate (0, 5)
    }
    connect relation {
      from (10, 40)
      to (90, 40)
      label "A & B"
    }
    circle hidden {
      center (10, 10)
      radius 5
      visible false
    }
  }
}`);
  if (!result.ok) throw new Error("Expected successful compilation");
  const svg = renderPreviewSvg(result.scene);
  expect(svg).toContain('data-chame-id="layer"');
  expect(svg).toMatch(/<line data-chame-id="layer.edge"[^>]*pointer-events="stroke"[^>]*transform="translate\(0 5\)"/);
  expect(svg).toMatch(/<path id="layer.relation"[^>]*data-chame-id="layer.relation"/);
  expect(svg).toMatch(/<text data-chame-id="layer.relation"[^>]*>A &amp; B<\/text>/);
  expect(svg).not.toContain("layer.hidden");
  expect(svg).toContain('<filter id="chame-preview-outline"');
  expect(svg).toContain('<feComposite in="expanded" in2="silhouette" operator="out"');
  expect(renderSvg(result.scene)).not.toMatch(/data-chame-|chame-preview-outline/);
});

test("renders transforms, shadows, line joins and wrapped text", () => {
  const result = compile(`canvas main {
  size (320, 180)
  rect card {
    at (20, 20)
    size (100, 60)
    stroke blue 2
    line-cap round
    line-join bevel
    shadow (0, 6) 12 "#00000044"
    rotate 10deg
  }
  text copy {
    content "abcdef"
    at (20, 120)
    font-size 10
    max-width 18
    wrap character
  }
}`);
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const svg = renderSvg(result.scene);
  expect(svg).toContain("feDropShadow");
  expect(svg).toContain('transform="rotate(10 70 50)"');
  expect(svg).toContain('stroke-linecap="round"');
  expect(svg).toContain('stroke-linejoin="bevel"');
  expect(svg).toContain("<tspan");
  expect(svg).toContain('dy="1.2em"');
});
