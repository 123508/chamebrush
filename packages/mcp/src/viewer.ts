import { App } from "@modelcontextprotocol/ext-apps";

interface CanvasPayload {
  name: string;
  width: number;
  height: number;
  mimeType: "image/svg+xml";
  svg: string;
}

type Payload =
  | { ok: true; source: string; canvases: CanvasPayload[]; animation?: { fps: number } }
  | { ok: false; source: string; diagnostics: Array<{ message: string; range: { line: number; column: number } }> };

const previewTab = document.querySelector<HTMLButtonElement>("#preview-tab")!;
const codeTab = document.querySelector<HTMLButtonElement>("#code-tab")!;
const previewPanel = document.querySelector<HTMLElement>("#preview-panel")!;
const codePanel = document.querySelector<HTMLElement>("#code-panel")!;
const sourceElement = document.querySelector<HTMLElement>("#source")!;
const diagnosticsElement = document.querySelector<HTMLOListElement>("#diagnostics")!;
const previewContent = document.querySelector<HTMLElement>("#preview-content")!;
const canvasSwitcher = document.querySelector<HTMLElement>("#canvas-switcher")!;
const statusElement = document.querySelector<HTMLElement>("#status")!;

let payload: Payload | undefined;
let playbackRequest: number | undefined;

function stopPlayback(): void {
  if (playbackRequest !== undefined) cancelAnimationFrame(playbackRequest);
  playbackRequest = undefined;
}

function setMode(mode: "preview" | "code"): void {
  previewTab.setAttribute("aria-selected", String(mode === "preview"));
  codeTab.setAttribute("aria-selected", String(mode === "code"));
  codePanel.hidden = mode !== "code";
  previewPanel.hidden = mode !== "preview" || payload?.ok === false;
  diagnosticsElement.hidden = mode !== "preview" || payload?.ok !== false;
}

function showCanvas(index: number): void {
  if (!payload?.ok) return;
  const canvas = payload.canvases[index];
  if (!canvas) return;
  const parsed = new DOMParser().parseFromString(canvas.svg, canvas.mimeType);
  const svg = parsed.documentElement;
  if (svg.localName !== "svg") {
    previewContent.textContent = "SVG 预览解析失败";
    return;
  }
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Chamebrush canvas ${canvas.name}`);
  previewContent.replaceChildren(document.importNode(svg, true));
  for (const [buttonIndex, button] of Array.from(canvasSwitcher.children).entries()) {
    const active = buttonIndex === index;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  const animationStatus = payload.animation
    ? ` · ${payload.animation.fps} fps · ${index + 1}/${payload.canvases.length}`
    : "";
  statusElement.textContent = `${canvas.name} · ${canvas.width} × ${canvas.height}${animationStatus}`;
}

function startPlayback(fps: number): void {
  if (!payload?.ok || payload.canvases.length < 2) return;
  const startedAt = performance.now();
  let previousFrame = 0;
  const tick = (now: number) => {
    if (!payload?.ok) return;
    const frame = Math.floor((now - startedAt) * fps / 1000) % payload.canvases.length;
    if (frame !== previousFrame) {
      previousFrame = frame;
      showCanvas(frame);
    }
    playbackRequest = requestAnimationFrame(tick);
  };
  playbackRequest = requestAnimationFrame(tick);
}

function render(next: Payload): void {
  stopPlayback();
  payload = next;
  sourceElement.textContent = next.source;
  canvasSwitcher.replaceChildren();
  diagnosticsElement.replaceChildren();

  if (next.ok) {
    if (!next.animation) {
      next.canvases.forEach((canvas, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "canvas-dot";
        button.textContent = String(index + 1);
        button.title = canvas.name;
        button.setAttribute("aria-label", `显示第 ${index + 1} 张画布：${canvas.name}`);
        button.addEventListener("click", () => showCanvas(index));
        canvasSwitcher.append(button);
      });
    }
    canvasSwitcher.hidden = Boolean(next.animation) || next.canvases.length < 2;
    showCanvas(0);
    if (next.animation) startPlayback(next.animation.fps);
  } else {
    canvasSwitcher.hidden = true;
    previewContent.replaceChildren();
    for (const diagnostic of next.diagnostics) {
      const item = document.createElement("li");
      item.textContent = `${diagnostic.range.line}:${diagnostic.range.column} ${diagnostic.message}`;
      diagnosticsElement.append(item);
    }
    statusElement.textContent = `${next.diagnostics.length} 个错误`;
  }
  setMode("preview");
}

function isPayload(value: unknown): value is Payload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Payload>;
  return typeof candidate.ok === "boolean" && typeof candidate.source === "string";
}

previewTab.addEventListener("click", () => setMode("preview"));
codeTab.addEventListener("click", () => setMode("code"));
window.addEventListener("pagehide", stopPlayback);

const app = new App({ name: "Chamebrush Viewer", version: "0.1.0" });
app.ontoolresult = (result) => {
  if (isPayload(result.structuredContent)) render(result.structuredContent);
};
void app.connect();
