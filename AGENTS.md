# Repository Guidelines

## Scope and Sources of Truth

Chamebrush is a pnpm workspace for a declarative 2D drawing language. Keep documentation and implementation aligned. For language work, the runtime source of truth is the handwritten parser and AST in `packages/language/src/index.ts` plus semantic compilation in `packages/core/src/index.ts`. The editor grammar lives in `packages/language/src/chamebrush.grammar`; regenerate `packages/language/src/chamebrush-parser.ts` after changing it. The normative user-facing reference is `docs/language-spec.md`.

Do not describe planned syntax as implemented. If behavior changes, update parser/compiler tests, the formal grammar and command tables in the language specification, the root README when the public feature set changes, and affected examples.

## Project Structure

- `packages/language`: tokenizer, handwritten parser, source AST, Lezer grammar and syntax-highlighting support.
- `packages/core`: semantic validation, expression evaluation, scopes, anchors and the renderer-independent scene tree.
- `packages/renderer-svg`: pure TypeScript scene-tree-to-SVG rendering.
- `packages/browser`: browser-facing compilation/rendering API and Canvas-based PNG/WebP export.
- `packages/cli`: Node.js CLI, local asset validation and Sharp-based PNG/WebP export.
- `apps/playground`: React/Vite editor, diagnostics, live preview, frame playback and downloads.
- `examples`: executable `.chame` samples and checked-in SVG results.
- `docs`: normative language and design documentation.

Put implementation and colocated `*.test.ts` files under each package's `src/`. Keep public APIs exported from package `src/index.ts`. Generated build output belongs in `dist/` and must not be committed. The generated Lezer parser is an exception and is committed beside its grammar.

## Setup, Build and Test Commands

Run commands from the repository root and use the pinned pnpm version from `package.json`.

```bash
corepack enable
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm test:watch
pnpm build
pnpm cli examples/logo.chame /tmp/chamebrush-logo.svg
pnpm --filter @chamebrush/language generate
```

`pnpm dev` starts the Playground on port 4173. `pnpm build` typechecks, builds the five public packages into their package-local `dist/` directories, and writes the production Playground to `dist/playground`. The CLI selects SVG, PNG or WebP from the output extension; use a temporary output path for smoke tests unless an example artifact intentionally changes. Run `pnpm release:check` before an npm release; it tests, builds and performs a dry run without uploading packages.

## Coding Style

Use TypeScript under the repository's strict settings, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Follow the existing style: two-space indentation, semicolons, double-quoted strings and trailing commas where appropriate. Use `camelCase` for values and functions, `PascalCase` for components and types, and lowercase package-directory names.

Keep browser-safe packages free of Node.js APIs. Avoid leaking SVG-specific concepts into the core scene model. Validate untrusted source input before rendering, preserve source ranges in diagnostics, and escape renderer output. Remote image URLs are intentionally rejected; do not relax that boundary without tests and documentation.

## Language Change Checklist

When changing syntax or semantics:

1. Update the handwritten tokenizer/parser and Source AST in `packages/language/src/index.ts`.
2. Update `packages/language/src/chamebrush.grammar`, run the language package's `generate` script, and test incomplete-input recovery.
3. Update semantic validation and Scene types in `packages/core/src/index.ts`.
4. Update every affected renderer and public API.
5. Add focused tests for valid input, invalid input, source-located diagnostics and rendering/escaping.
6. Update `docs/language-spec.md`, README feature/API examples, and relevant `.chame` examples.

The handwritten parser and Lezer grammar must accept the same complete programs even though Lezer additionally supports recoverable incomplete editor input. Declaration names cannot contain hyphens; command names such as `font-size` can.

## Testing Guidelines

Tests use Vitest and are colocated with implementation. Add focused coverage for:

- tokenization, precedence, lists, comments and parser recovery;
- command arity, required fields, enum/range checks and diagnostics;
- variable scopes, object ordering, built-in/custom anchors and transforms;
- scene-tree output and multi-canvas/animation behavior;
- SVG escaping, visibility, transforms, shadows and image handling;
- browser or CLI exports when their behavior changes.

Before handing off a change, run `pnpm typecheck` and `pnpm test`. Run `pnpm build` for Playground, browser API, dependency or build-configuration changes. Regenerate intentional example SVG changes with the CLI and inspect the diff; never rewrite every generated example as an unrelated side effect.

## Documentation Style

README and language documentation are written primarily in Simplified Chinese; contributor instructions may remain in English. Use runnable examples and repository-relative links. In the language specification, distinguish normative requirements ("必须", "不得") from advice ("建议"). Record defaults, units, accepted enum values, ordering rules and known limitations rather than relying on examples alone.

## Commits and Pull Requests

No stable commit convention is established in this checkout. Use concise imperative subjects such as `Add polygon parsing` or `Fix SVG text escaping`. Pull requests should explain the user-visible change, name affected packages, report test/typecheck/build results, link the relevant issue, and include a screenshot or reproduction for Playground or rendering changes.

## Generated and Local Files

Do not commit `node_modules/`, `dist/`, coverage, logs, OS metadata or ad hoc raster previews. Do commit intentional source changes, regenerated `packages/language/src/chamebrush-parser.ts`, documentation, licensing files and example SVGs that are part of the change. The repository root and Playground remain private packages; the five packages under `packages/` are the npm publication units.
