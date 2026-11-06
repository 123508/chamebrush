#!/usr/bin/env node

import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { compile, compileAll, type Scene, type SceneNode } from "@chamebrush/core";
import { renderSvg } from "@chamebrush/renderer-svg";
import sharp from "sharp";
import { parseArguments } from "./options";

function usage(): never {
  console.error("用法：chame render <input.chame> -o <output.svg|png|webp> [--canvas name] [--scale 2] [--json]");
  process.exit(1);
}

function imageSources(nodes: SceneNode[]): string[] {
  return nodes.flatMap((node) => node.kind === "image" ? [node.source] : node.kind === "group" ? imageSources(node.children) : []);
}

async function validateAssets(scene: Scene, input: string): Promise<void> {
  for (const source of imageSources(scene.children)) {
    if (source.startsWith("data:")) continue;
    try {
      await access(resolve(dirname(input), source));
    } catch {
      throw new Error(`图片文件不存在：${source}`);
    }
  }
}

async function renderScene(scene: Scene, extension: ".svg" | ".png" | ".webp", scale: number): Promise<string | Buffer> {
  const svg = renderSvg(scene);
  if (extension === ".svg") return svg;
  const raster = sharp(Buffer.from(svg)).resize(Math.round(scene.width * scale), Math.round(scene.height * scale));
  return extension === ".png" ? raster.png().toBuffer() : raster.webp().toBuffer();
}

const options = parseArguments(process.argv.slice(2)) ?? usage();
const extension = extname(options.output).toLowerCase();
if (extension !== ".svg" && extension !== ".png" && extension !== ".webp") {
  const message = "输出文件必须使用 .svg、.png 或 .webp 扩展名";
  if (options.json) console.log(JSON.stringify({ ok: false, error: message }));
  else console.error(message);
  process.exitCode = 1;
} else {
  try {
    const inputPath = resolve(options.input);
    const source = await readFile(inputPath, "utf8");
    const result = options.canvas ? compile(source, { canvas: options.canvas }) : compileAll(source);
    if (!result.ok) {
      if (options.json) {
        console.log(JSON.stringify({ ok: false, diagnostics: result.diagnostics }));
      } else {
        for (const diagnostic of result.diagnostics) console.error(`${options.input}:${diagnostic.range.line}:${diagnostic.range.column}: ${diagnostic.message}`);
      }
      process.exitCode = 1;
    } else {
      const scenes = "scene" in result ? [result.scene] : result.scenes;
      const outputPath = resolve(options.output);
      const outputs: Array<{ canvas: string; path: string; width: number; height: number; mimeType: string }> = [];
      for (const scene of scenes) {
        await validateAssets(scene, inputPath);
        const sceneOutput = scenes.length === 1 ? outputPath : `${outputPath.slice(0, -extension.length)}-${scene.name}${extension}`;
        await writeFile(sceneOutput, await renderScene(scene, extension, options.scale));
        outputs.push({
          canvas: scene.name,
          path: sceneOutput,
          width: scene.width,
          height: scene.height,
          mimeType: extension === ".svg" ? "image/svg+xml" : extension === ".png" ? "image/png" : "image/webp",
        });
        if (!options.json) console.log(`已生成 ${sceneOutput}`);
      }
      if (options.json) console.log(JSON.stringify({ ok: true, outputs }));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }));
    else console.error(message);
    process.exitCode = 1;
  }
}
