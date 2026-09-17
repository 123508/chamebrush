#!/usr/bin/env node

import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { compile, compileAll, type Scene, type SceneNode } from "@chamebrush/core";
import { renderSvg } from "@chamebrush/renderer-svg";
import sharp from "sharp";

interface CliOptions {
  input: string;
  output: string;
  canvas?: string;
  scale: number;
}

function usage(): never {
  console.error("用法：chame render <input.chame> -o <output.svg|png|webp> [--canvas name] [--scale 2]");
  console.error("兼容用法：pnpm cli <input.chame> <output.svg|png|webp>");
  process.exit(1);
}

function parseArguments(args: string[]): CliOptions {
  if (args[0] !== "render" && args.length === 2) return { input: args[0]!, output: args[1]!, scale: 1 };
  if (args[0] !== "render" || !args[1]) return usage();
  let output: string | undefined;
  let canvas: string | undefined;
  let scale = 1;
  for (let index = 2; index < args.length; index += 1) {
    const argument = args[index];
    if ((argument === "-o" || argument === "--output") && args[index + 1]) output = args[++index];
    else if (argument === "--canvas" && args[index + 1]) canvas = args[++index];
    else if (argument === "--scale" && args[index + 1]) scale = Number(args[++index]);
    else return usage();
  }
  if (!output || !Number.isFinite(scale) || scale <= 0) return usage();
  return { input: args[1], output, ...(canvas ? { canvas } : {}), scale };
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

const options = parseArguments(process.argv.slice(2));
const extension = extname(options.output).toLowerCase();
if (extension !== ".svg" && extension !== ".png" && extension !== ".webp") {
  console.error("输出文件必须使用 .svg、.png 或 .webp 扩展名");
  process.exitCode = 1;
} else {
  try {
    const inputPath = resolve(options.input);
    const source = await readFile(inputPath, "utf8");
    const result = options.canvas ? compile(source, { canvas: options.canvas }) : compileAll(source);
    if (!result.ok) {
      for (const diagnostic of result.diagnostics) console.error(`${options.input}:${diagnostic.range.line}:${diagnostic.range.column}: ${diagnostic.message}`);
      process.exitCode = 1;
    } else {
      const scenes = "scene" in result ? [result.scene] : result.scenes;
      const outputPath = resolve(options.output);
      for (const scene of scenes) {
        await validateAssets(scene, inputPath);
        const sceneOutput = scenes.length === 1 ? outputPath : `${outputPath.slice(0, -extension.length)}-${scene.name}${extension}`;
        await writeFile(sceneOutput, await renderScene(scene, extension, options.scale));
        console.log(`已生成 ${sceneOutput}`);
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
