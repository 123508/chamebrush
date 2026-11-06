import { compile, compileAll } from "@chamebrush/core";
import type { Diagnostic } from "@chamebrush/language";
import { renderSvg } from "@chamebrush/renderer-svg";

export interface RenderedCanvas {
  name: string;
  width: number;
  height: number;
  mimeType: "image/svg+xml";
  svg: string;
}

export type ChamebrushRenderResult =
  | {
      ok: true;
      source: string;
      canvases: RenderedCanvas[];
      animation?: { fps: number };
    }
  | {
      ok: false;
      source: string;
      diagnostics: Diagnostic[];
    };

export function renderChamebrush(source: string, canvas?: string): ChamebrushRenderResult {
  const result = canvas ? compile(source, { canvas }) : compileAll(source);
  if (!result.ok) return { ok: false, source, diagnostics: result.diagnostics };

  const scenes = "scene" in result ? [result.scene] : result.scenes;
  return {
    ok: true,
    source,
    canvases: scenes.map((scene) => ({
      name: scene.name,
      width: scene.width,
      height: scene.height,
      mimeType: "image/svg+xml",
      svg: renderSvg(scene),
    })),
    ...("animation" in result && result.animation ? { animation: result.animation } : {}),
  };
}
