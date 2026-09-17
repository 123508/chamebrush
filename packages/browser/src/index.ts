export { compile, compileAll, type AnimationSettings, type CompileAllResult, type CompileResult, type Scene } from "@chamebrush/core";
export { renderSvg } from "@chamebrush/renderer-svg";

import { compile, type Scene } from "@chamebrush/core";
import { renderSvg } from "@chamebrush/renderer-svg";

export async function renderSvgBlob(scene: Scene): Promise<Blob> {
  return new Blob([renderSvg(scene)], { type: "image/svg+xml;charset=utf-8" });
}

async function loadSvgImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("浏览器无法读取生成的 SVG"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function renderBitmapBlob(scene: Scene, type: "image/png" | "image/webp", scale = 1): Promise<Blob> {
  if (scale <= 0) throw new Error("scale 必须大于零");
  const svgBlob = await renderSvgBlob(scene);
  const image = await loadSvgImage(svgBlob);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(scene.width * scale);
  canvas.height = Math.round(scene.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持 Canvas 2D");
  context.scale(scale, scale);
  context.drawImage(image, 0, 0);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("浏览器无法生成 PNG"));
    }, type);
  });
}

export function renderPngBlob(scene: Scene, scale = 1): Promise<Blob> {
  return renderBitmapBlob(scene, "image/png", scale);
}

export function renderWebpBlob(scene: Scene, scale = 1): Promise<Blob> {
  return renderBitmapBlob(scene, "image/webp", scale);
}

export async function renderSourceToBlob(
  source: string,
  options: { format: "svg" | "png" | "webp"; scale?: number; canvas?: string },
): Promise<Blob> {
  const result = compile(source, { ...(options.canvas ? { canvas: options.canvas } : {}) });
  if (!result.ok) throw new Error(result.diagnostics.map((item) => item.message).join("\n"));
  if (options.format === "svg") return renderSvgBlob(result.scene);
  return options.format === "png"
    ? renderPngBlob(result.scene, options.scale ?? 1)
    : renderWebpBlob(result.scene, options.scale ?? 1);
}
