---
name: chamebrush-drawing
description: Create, edit, validate, and render diagrams, posters, charts, illustrations, and other editable 2D graphics with Chamebrush. Use when a user asks an AI agent to draw or visualize something as code; do not use for photo editing or photorealistic image generation.
license: MIT
metadata:
  author: chamebrush
  version: "0.1"
---

# Chamebrush Drawing

Produce editable `.chame` source and verify it with the real compiler before claiming that the drawing is complete.

Requires Node.js 20.11 or later for the MCP Viewer; the CLI requires Node.js 20.9 or later. Its runtime consists only of the npm packages `@chamebrush/mcp` and `@chamebrush/cli`. Rich code/preview switching requires an MCP Apps-capable host.

## Runtime resolution

Use one of these npm-backed paths:

1. For interactive code/preview output, use the `chamebrush_render` tool exposed by this stdio server:

   ```json
   {
     "command": "npx",
     "args": ["-y", "@chamebrush/mcp"]
   }
   ```

2. When the MCP tool is unavailable, run the published CLI package without changing the user's project dependencies:

   ```bash
   npx -y @chamebrush/cli render <input.chame> -o <output.svg>
   ```

If npm package execution is unavailable, report the missing runtime instead of substituting an unverified renderer.

## Workflow

1. Read [references/language-quick-reference.md](references/language-quick-reference.md) before generating Chamebrush source. Pay particular attention to command line boundaries and the exact signatures of common commands; do not infer syntax from CSS, SVG, Mermaid, or another drawing language.
2. Translate the request into one complete Chamebrush document. Use one clearly named `canvas` unless the user needs frames or variants. Write command blocks in their final multiline form: one command per physical line. Do not first produce compact one-line blocks and then split them with a regex or keyword-based formatter.
3. Inspect the available tools before choosing a renderer. If `chamebrush_render` is available, you MUST call it with the complete final source, even if you also used the CLI while editing. Do not substitute a shell or CLI render for this final tool call: the MCP call is what creates the interactive code/preview viewer on MCP Apps hosts.
4. Only when `chamebrush_render` is not available, save the source as a `.chame` file and render it with the `@chamebrush/cli` npm command above. In the final response, state briefly that the MCP Viewer was unavailable and provide the single-file fallback preview.
5. For a large repetitive or multi-canvas document, compile one minimal representative canvas before expanding the repeated structure. Then compile the complete document, repair every diagnostic, and render again. Stop after three unsuccessful repair attempts and report the remaining source-located diagnostics instead of claiming success.
6. Choose one presentation path. When the MCP Viewer is rendered, treat its code/preview tabs as the primary result and do not repeat the same drawing as a Markdown image or attach generated files unless the user asks to download or persist them. Without the Viewer, return the editable source plus one rendered SVG or PNG when the host supports files or images. In text-only chat, fence source with `chame` so compatible hosts can recognize it.

## Output choices

- Prefer SVG for diagrams, text-heavy graphics, and scalable previews.
- Use PNG or WebP only when requested or when the host cannot display SVG.
- Do not emit both SVG and PNG for the same canvas by default. Generate multiple formats only when the user requests them.
- For multiple canvases, preserve source order and explain whether they are variants or animation frames.
- On text-only hosts, return the complete `chame` code block and the compiler result.

## Constraints

- Use only implemented syntax from the quick reference; do not invent commands.
- Put exactly one command on each physical line. The only supported compact block form is a block containing a single command, such as `canvas main { size (320, 200) }`.
- Generate valid multiline source directly. Never use a text replacement or keyword list to split commands: words such as `center` and `round` can be values as well as command names.
- Preserve existing source when editing and change only what the request requires.
- Keep object declarations in dependency order because an object cannot reference a later object.
- Use local or `data:` image sources. Chamebrush rejects remote image URLs.
- Do not manually edit generated SVG as a substitute for fixing the `.chame` source.
