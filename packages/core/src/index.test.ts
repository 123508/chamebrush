import { describe, expect, test } from "vitest";
import { compile, compileAll } from "./index";

describe("compile", () => {
  test("compiles variables, anchors and connectors", () => {
    const result = compile(`let width 200
let gap 40

canvas main {
  size (600, 300)

  rect first {
    at (20, 40)
    size (width, 80)
    fill "#fff"
  }

  rect second {
    at (first.right.x + gap, first.top.y)
    size (width, 80)
  }

  connect relation {
    from first.right
    to second.left
    arrow end
  }
}`);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.scene.width).toBe(600);
    expect(result.scene.children).toHaveLength(3);
    expect(result.scene.children[1]).toMatchObject({
      kind: "rect",
      bounds: { x: 260, y: 40, width: 200, height: 80 },
    });
  });

  test("returns a source-located diagnostic", () => {
    const result = compile(`canvas main {
  size (800, 600)
  rect card {
    at (10, 10)
  }
}`);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.message).toContain("size");
    expect(result.diagnostics[0]?.range.line).toBe(3);
  });

  test("compiles every canvas in a document", () => {
    const result = compileAll(`let color "#123456"

canvas first {
  size (100, 80)
  background color
}

canvas second {
  size (200, 120)
}`);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.scenes.map((scene) => scene.name)).toEqual(["first", "second"]);
    expect(result.scenes.map((scene) => [scene.width, scene.height])).toEqual([[100, 80], [200, 120]]);
  });
});

describe("animation", () => {
  const canvases = `canvas first { size (100, 80) }
canvas second { size (100, 80) }`;

  test("keeps documents manual by default and preserves frame order", () => {
    const result = compileAll(canvases);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.animation).toBeUndefined();
    expect(result.scenes.map((scene) => scene.name)).toEqual(["first", "second"]);
  });

  test.each([1, 12, 23.976, 120])("exposes %s fps for browser playback", (fps) => {
    const result = compileAll(`animation { fps ${fps} }\n${canvases}`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.animation).toEqual({ fps });
    expect(result.scenes).toHaveLength(2);
  });

  test("accepts animation after canvases and single-frame static exports", () => {
    const source = `canvas only { size (100, 80) }\nanimation { fps 12 }`;
    expect(compileAll(source)).toMatchObject({ ok: true, animation: { fps: 12 } });
    expect(compile(source)).toMatchObject({ ok: true, scene: { name: "only" } });
  });

  test.each([
    ["animation {}", "缺少 fps"],
    ["animation { fps 0 }", "fps 必须"],
    ["animation { fps -1 }", "fps 必须"],
    ["animation { fps 121 }", "fps 必须"],
    ["animation { fps 12px }", "fps 必须"],
    ["animation { fps 12% }", "fps 必须"],
    ["animation { fps 12deg }", "fps 必须"],
    ['animation { fps "12" }', "fps 必须"],
    ["animation { fps true }", "fps 必须"],
    ["animation { fps speed }", "fps 必须"],
    ["animation { fps 6 * 2 }", "fps 必须"],
    ["animation { fps }", "fps 必须"],
    ["animation { fps 12 24 }", "fps 必须"],
    ["animation { fps 12\nfps 24 }", "不能重复"],
    ["animation { speed 12 }", "不支持命令"],
    ["animation { fps 12 }\nanimation { fps 24 }", "只能声明一个"],
  ])("rejects invalid configuration: %s", (animation, message) => {
    for (const compiler of [compile, compileAll]) {
      const result = compiler(`${animation}\n${canvases}`);
      expect(result.ok).toBe(false);
      expect(result.diagnostics[0]?.message).toContain(message);
      expect(result.diagnostics[0]?.range.line).toBeGreaterThan(0);
    }
  });
});

describe("appearance and transforms", () => {
  test("compiles ordered transforms, shadow and stroke joins", () => {
    const result = compile(`canvas main {
  size (300, 200)
  rect card {
    at (20, 30)
    size (100, 60)
    stroke blue 3
    line-cap round
    line-join bevel
    shadow (0, 8) 16 "#00000044"
    origin center
    translate (10, 5)
    rotate 15deg
    scale (1.2, 0.8)
  }
}`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.scene.children[0]).toMatchObject({
      kind: "rect",
      shadow: { offset: { x: 0, y: 8 }, blur: 16 },
      stroke: { width: 3, lineCap: "round", lineJoin: "bevel" },
    });
    expect(result.scene.children[0]?.transforms.map((transform) => transform.kind)).toEqual(["translate", "rotate", "scale"]);
  });

  test("wraps text into scene lines", () => {
    const result = compile(`canvas main {
  size (300, 200)
  text copy {
    content "abcdef"
    at (10, 20)
    font-size 10
    max-width 18
    wrap character
    line-height 1.5
  }
}`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.scene.children[0]).toMatchObject({ kind: "text", lines: ["abc", "def"], lineHeight: 1.5, maxWidth: 18 });
  });

  test.each([
    ["unknown command", "rect bad { at (0, 0)\n size (10, 10)\n typo 1 }", "不支持命令"],
    ["invalid route", "connect bad { from (0, 0)\n to (1, 1)\n route diagonal }", "值“diagonal”无效"],
    ["remote image", "image bad { source \"https://example.com/a.png\"\n at (0, 0)\n size (10, 10) }", "远程 URL"],
  ])("rejects %s", (_name, object, message) => {
    const result = compile(`canvas main { size (100, 100)\n${object}\n}`);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.message).toContain(message);
  });
});

test("reports multiple syntax errors from one document", () => {
  const result = compile(`canvas main {
  size (, 100)
  rect card {
    at (, 20)
    size (20, )
  }
}`);
  expect(result.ok).toBe(false);
  expect(result.diagnostics.length).toBeGreaterThanOrEqual(2);
  expect(result.diagnostics.every((diagnostic) => diagnostic.range.line > 0)).toBe(true);
});
