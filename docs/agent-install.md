# Chamebrush Agent Installation Guide

This guide is for AI agents responding to a user's installation request. Install the Skill and CLI for all clients first, then follow the steps for the current client. Use published npm packages as the runtime; the user does not need to clone the Chamebrush repository manually.

First identify the current client:

- **General agents**, including environments where the client cannot be identified: follow sections 1, 2, and 5 and use the CLI to render.
- **Codex desktop**: follow sections 1, 2, 3, and 5, installing the MCP package and configuring the Viewer as well.
- **MiMo Desktop / MiMoCode Desktop**: follow sections 1, 2, 4, and 5, using `sci-widget` for preview and source switching.

Follow section 3 only when the current client explicitly identifies itself as Codex desktop. Finding a `codex` command, configuration directory, or MCP tool is not sufficient to identify the current client. Likewise, do not infer that the current client is MiMo desktop merely because MiMo is installed or its files are present.

Installation writes to the Skill directory selected by the user and to the npm global directory; the Codex MCP configuration writes to the user's configuration. Follow client and operating system permission prompts. Do not bypass approvals or modify unrelated existing configuration. If a step fails, report the actual reason; do not claim that it succeeded.

## 1. Check the environment and install the Skill

Check:

```bash
node --version
npm --version
```

The CLI requires Node.js 20.9 or later. The MCP Viewer for Codex desktop additionally requires Node.js 20.11 or later. If Node.js or npm is missing, or the Node version does not meet the relevant requirement, explain the problem and stop the affected installation. Do not change the Node version yourself.

Run:

```bash
npx skills add https://github.com/123508/chamebrush/tree/main/skills/chamebrush-drawing
```

The installer may ask the user to choose agents, installation scope, and installation method. Respect their choices; do not default to installing for every agent. If the environment cannot interact with the installer, ask the user to complete the selection and do not claim installation succeeded.

If the installer automatically uses non-interactive mode, check and report the installation location and agents it actually selected.

Confirm that the output reports `chamebrush-drawing` as installed. If it already exists, preserve the existing installation and follow the installer's prompts; do not delete existing content.

## 2. All clients: check and install the CLI

Check:

```bash
npm list --global --depth=0 @chamebrush/cli
```

Inspect the output and exit status:

- If the package name and version are listed, the package is installed.
- If the output clearly shows the package is missing, run the installation command below.
- Report and address other errors, such as an unavailable npm executable or a permission error; do not treat them as a missing package.

```bash
npm install --global @chamebrush/cli@0.1.1
```

After installation, run the `npm list` command again to confirm.

Do not automatically overwrite or downgrade an existing package. The CLI requires at least version 0.1.1; if the installed version is older, inform the user and obtain consent before upgrading.

If the npm global directory is not writable, follow the client's permission process; do not use `sudo` by default.

## 3. Codex desktop only: install MCP and configure the Viewer

Follow this section only when the current client is explicitly confirmed to be Codex desktop. Do not follow it for Codex CLI, IDE extensions, other clients, or unidentified environments.

Check the MCP package:

```bash
npm list --global --depth=0 @chamebrush/mcp
```

Install it only if it is clearly missing:

```bash
npm install --global @chamebrush/mcp@0.1.0
```

Check again after installation. Do not automatically overwrite or downgrade an existing package. MCP requires at least version 0.1.0; if the installed version is older, inform the user and obtain consent before upgrading. Report actual errors when checking or installing and follow the permission rules in section 2.

### 3.1 Confirm the actual configuration directory

Before checking or modifying MCP configuration, confirm the `CODEX_HOME` actually used by the current Codex client. Do not assume that the user directory resolved by the terminal process is the one used by the client.

Sandboxes, containers, remote environments, and separate system accounts may use different user directories and configurations. Even if an environment variable appears to point to the user's directory, confirm that the CLI and current client use the same configuration.

- Prefer the `CODEX_HOME` explicitly supplied by the client or a verified configuration directory.
- Codex normally uses `.codex` under the user's home directory, but verify it against the client environment or configuration rather than guessing from the path alone.
- If the client's actual directory cannot be established, report what was checked and ask the user for it. Do not treat the CLI's default configuration as the client's configuration without verification.

Explicitly use the same verified `CODEX_HOME` for every subsequent `codex mcp` inspection or modification command. Do not permanently change system environment variables.

Use a method appropriate to the operating system and shell. For example:

**macOS, Linux, or another POSIX-compatible shell:**

```bash
CODEX_HOME="/verified/Codex-config-directory" codex mcp list --json
```

**Windows PowerShell:**

```powershell
$env:CODEX_HOME = 'verified Codex configuration directory'
codex mcp list --json
```

These directories are placeholders; replace them with the verified directory. The PowerShell setting affects only the current process and its children. If each command runs in a new process, specify it again each time.

If the environment is restricted, follow the client's permission process; do not bypass approvals.

### 3.2 Check and configure the server

Using the verified `CODEX_HOME`, check:

```bash
codex mcp list --json
```

If no server named `chamebrush` exists, run:

```bash
codex mcp add chamebrush -- npx -y @chamebrush/mcp
```

On Windows, if the environment requires `npx.cmd`, use:

```powershell
codex mcp add chamebrush -- npx.cmd -y @chamebrush/mcp
```

Continue to explicitly use the `CODEX_HOME` verified in section 3.1 when running these commands.

If a server with the same name already exists, do not overwrite, remove, or duplicate it. Check whether it is enabled and points to `@chamebrush/mcp`. If there is a conflict or the configuration is unclear, report the situation and ask the user how to proceed.

Using the same `CODEX_HOME`, run again:

```bash
codex mcp list --json
```

Confirm the server exists and is enabled, and report the configuration directory checked.

### 3.3 Verify the tool

A configured server does not prove that the server is connected or the Viewer is available. If the current client can refresh tools, check that `chamebrush_render` actually appears and call it. Only report the Viewer as verified after the tool has been discovered and successfully called.

If the tool is not available in the current session, explain whether the configuration was just changed and ask the user to check in a new Codex task.

If a new task still does not load the tool, do not repeatedly suggest restarting or creating tasks. Inspect the server startup logs, execution environment, and actual error; distinguish confirmed causes from possibilities and report unfinished steps.

## 4. MiMo desktop only: verify the in-message preview

Follow this section only when the current client explicitly identifies itself as MiMo Desktop or MiMoCode Desktop. This client uses the CLI to compile SVG and an in-chat `sci-widget` to switch between preview and source. It does not need the `@chamebrush/mcp` package or a Codex MCP registration.

Confirm that the Skill and CLI from sections 1 and 2 are installed. When drawing, read `references/mimo-desktop.md` from the installed Skill and output a self-contained `sci-widget` as described there. If the user requests verification, compile a simple canvas and output the widget in chat; judge success by what the client actually displays and how it responds to interaction. Installation or HTML generation alone does not verify the interface.

## 5. Report installation results

Report the actual status of each applicable item:

- The Skill installation result, installation location, and agents reported by the installer.
- The CLI package installation result and version.
- Codex desktop only: the MCP package result and version; the server configuration directory, enabled state, and command; whether `chamebrush_render` actually appeared and was successfully called; and whether the Viewer was verified.
- MiMo desktop only: whether the `sci-widget` was actually displayed and its interaction verified; say explicitly if it was not tested.

State whether a new task or restart is needed and identify any unfinished steps. General agents can use the CLI to generate SVG; Codex desktop uses the MCP Viewer; MiMo desktop outputs a `sci-widget` following the Skill guidance.
