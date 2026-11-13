# Codex desktop Viewer

Use this guidance only when the current host explicitly identifies itself as the Codex desktop app. The interactive Viewer requires an MCP Apps-capable host, Node.js 20.11 or later, npm, and the published `@chamebrush/mcp` package. `npx` can fetch the package on demand; a global installation is not required.

## Render and present

Inspect the available tools. If `chamebrush_render` is available, call it with the complete final source, even if the CLI was used while editing. This tool call creates the code/preview Viewer. Treat the Viewer as the primary result; do not repeat the drawing as a Markdown image or attach generated files unless the user asks to download or persist them.

If the tool is not available, follow the setup checks below. If it remains unavailable, complete the current drawing with the CLI workflow in `SKILL.md`, provide the fallback preview, and report the actual setup status. Do not claim that the Viewer is available merely because the package is installed or the server is configured.

## First-use setup

Check `codex mcp list --json` in the same environment and configuration used by the current desktop client. If the client's configuration location cannot be established, report that limitation rather than modifying an unrelated configuration.

- If no server named `chamebrush` is configured, register it once with `codex mcp add chamebrush -- npx -y @chamebrush/mcp`. This changes the user's Codex MCP configuration; follow the host's permission and approval prompts. On Windows, use the executable available in the user's environment (for example, `npx.cmd` if required).
- If `chamebrush` is already configured, do not overwrite, remove, or duplicate it. If it is disabled or points elsewhere, explain the conflict or diagnose the existing configuration.
- Verify registration with `codex mcp list --json`. If the host supports refreshing tools, check whether `chamebrush_render` becomes available. If it remains unavailable after registration, a new Codex task or restart may be needed. In the new task, use the actual tool to verify the Viewer.
- If configuration is blocked, npm or Node is missing, or the server cannot start, report the actual failure and use the CLI fallback when available. Do not retry registration repeatedly. If a new task still cannot load the tool, investigate the startup error instead of repeatedly asking the user to restart.
