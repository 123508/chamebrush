import { StrictMode, useDeferredValue, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { compileAll, renderPngBlob, renderSvg, renderSvgBlob, renderWebpBlob } from "@chamebrush/browser";
import logoUrl from "../../../examples/logo.svg";
import { Editor } from "./Editor";
import { initialSource } from "./example";
import "./styles.css";

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function App() {
  const [source, setSource] = useState(initialSource);
  const [selectedCanvas, setSelectedCanvas] = useState(0);
  const [exporting, setExporting] = useState<"svg" | "png" | "webp">();
  const [exportStatus, setExportStatus] = useState<{ kind: "success" | "error"; message: string }>();
  const deferredSource = useDeferredValue(source);
  const result = useMemo(() => compileAll(deferredSource), [deferredSource]);
  const [playback, setPlayback] = useState({ result, frame: 0 });
  const fps = result.ok ? result.animation?.fps : undefined;
  const frames = useMemo(() => result.ok ? result.scenes.map(renderSvg) : [], [result]);

  useEffect(() => {
    if (!fps || frames.length < 2) return;
    const startedAt = performance.now();
    let requestId: number;
    const tick = (now: number) => {
      const frame = Math.floor((now - startedAt) * fps / 1000) % frames.length;
      setPlayback((previous) => previous.result === result && previous.frame === frame
        ? previous
        : { result, frame });
      requestId = requestAnimationFrame(tick);
    };
    requestId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestId);
  }, [result, fps, frames.length]);

  const activeCanvasIndex = result.ok
    ? fps ? playback.result === result ? playback.frame : 0
      : Math.min(selectedCanvas, result.scenes.length - 1)
    : 0;
  const scene = result.ok ? result.scenes[activeCanvasIndex] : undefined;
  const svg = frames[activeCanvasIndex] ?? "";

  const exportFile = async (format: "svg" | "png" | "webp") => {
    if (!scene) return;
    setExportStatus(undefined);
    setExporting(format);
    try {
      const blob = format === "svg" ? await renderSvgBlob(scene)
        : format === "png" ? await renderPngBlob(scene)
          : await renderWebpBlob(scene);
      download(blob, `${scene.name}.${format}`);
      setExportStatus({ kind: "success", message: `${format.toUpperCase()} 已开始下载` });
    } catch (error) {
      setExportStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "导出失败，请重试",
      });
    } finally {
      setExporting(undefined);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img className="logo-mark" src={logoUrl} alt="Chamebrush Logo" />
          <div>
            <h1>Chamebrush</h1>
            <p>用代码创造图形</p>
          </div>
        </div>
        <div className="actions">
          <span
            className={result.ok && exportStatus?.kind !== "error" ? "status ok" : "status error"}
            role={exportStatus?.kind === "error" ? "alert" : "status"}
          >
            {exportStatus?.message ?? (result.ok ? "编译成功" : `${result.diagnostics.length} 个错误`)}
          </span>
          <button disabled={!result.ok || Boolean(exporting)} onClick={() => void exportFile("svg")}>
            {exporting === "svg" ? "正在导出…" : "导出 SVG"}
          </button>
          <button className="primary" disabled={!result.ok || Boolean(exporting)} onClick={() => void exportFile("png")}>
            {exporting === "png" ? "正在导出…" : "导出 PNG"}
          </button>
          <button disabled={!result.ok || Boolean(exporting)} onClick={() => void exportFile("webp")}>
            {exporting === "webp" ? "正在导出…" : "导出 WebP"}
          </button>
        </div>
      </header>

      <section className="workspace">
        <section className="pane editor-pane">
          <div className="pane-title">
            <span>drawing.chame</span>
            <span>{source.split("\n").length} 行</span>
          </div>
          <Editor value={source} diagnostics={result.ok ? [] : result.diagnostics} onChange={setSource} />
          {!result.ok && (
            <div className="diagnostics">
              {result.diagnostics.map((diagnostic, index) => (
                <div key={`${diagnostic.range.from}-${index}`}>
                  <strong>{diagnostic.range.line}:{diagnostic.range.column}</strong>
                  <span>{diagnostic.message}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="pane preview-pane">
          <div className="pane-title">
            <span>实时预览</span>
            {scene && <span>{scene.width} × {scene.height}{fps ? ` · ${fps} fps · ${activeCanvasIndex + 1}/${frames.length}` : ""}</span>}
          </div>
          <div className="preview-stage">
            {scene
              ? <div className="preview-content">
                  <div className="svg-preview" dangerouslySetInnerHTML={{ __html: svg }} />
                  {result.ok && result.scenes.length > 1 && !fps && (
                    <div className="canvas-switcher" aria-label="选择画布">
                      {result.scenes.map((canvas, index) => (
                        <button
                          key={canvas.name}
                          className={index === activeCanvasIndex ? "canvas-dot active" : "canvas-dot"}
                          aria-label={`显示第 ${index + 1} 张图片：${canvas.name}`}
                          aria-pressed={index === activeCanvasIndex}
                          onClick={() => setSelectedCanvas(index)}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              : <div className="empty-state">修复左侧语法错误后将在这里显示图形</div>}
          </div>
        </section>
      </section>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");
createRoot(root).render(<StrictMode><App /></StrictMode>);
