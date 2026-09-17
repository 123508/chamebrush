import { expect, test } from "vitest";
import { compile } from "@chamebrush/core";
import { renderSvg } from "./index";

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
