import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { renderChamebrush } from "./render.js";

const resourceUri = "ui://chamebrush/viewer-v4.html";

export function createServer(): McpServer {
  const server = new McpServer({ name: "Chamebrush", version: "0.1.0" });

  registerAppTool(
    server,
    "chamebrush_render",
    {
      title: "Render Chamebrush drawing",
      description: "Compile Chamebrush source into SVG previews with source-located diagnostics and an interactive code/preview viewer.",
      inputSchema: z.object({
        source: z.string().min(1).describe("A complete Chamebrush document"),
        canvas: z.string().min(1).optional().describe("Optional canvas name to render"),
      }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri } },
    },
    async ({ source, canvas }) => {
      const result = renderChamebrush(source, canvas);
      const summary = result.ok
        ? `Rendered ${result.canvases.length} Chamebrush canvas${result.canvases.length === 1 ? "" : "es"}: ${result.canvases.map((item) => item.name).join(", ")}.`
        : result.diagnostics.map((item) => `${item.range.line}:${item.range.column} ${item.message}`).join("\n");
      return {
        content: [{ type: "text" as const, text: summary }],
        structuredContent: result,
      };
    },
  );

  registerAppResource(
    server,
    "Chamebrush code and preview viewer",
    resourceUri,
    {
      description: "Switch between rendered Chamebrush canvases and their editable source code.",
      mimeType: RESOURCE_MIME_TYPE,
    },
    async () => ({
      contents: [{
        uri: resourceUri,
        mimeType: RESOURCE_MIME_TYPE,
        text: await readFile(join(import.meta.dirname, "viewer.html"), "utf8"),
        _meta: {
          ui: {
            prefersBorder: false,
            csp: {
              connectDomains: [],
              resourceDomains: [],
            },
          },
        },
      }],
    }),
  );

  return server;
}
