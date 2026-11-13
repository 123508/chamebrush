# MiMo Desktop interactive preview

Apply this guidance only when the current host explicitly identifies itself as MiMo Desktop or MiMoCode Desktop. Use the Chamebrush CLI described in `SKILL.md`; do not configure Codex or require an MCP server.

## Compile and prepare

1. Write and compile the complete `.chame` source with the real CLI. Capture the complete source and generated SVG for each canvas. Intermediate files may be used for compilation; do not present a widget as a disk file. If compilation fails, fix the diagnostics and compile again; if it still fails, report the diagnostics without claiming a successful preview.
2. The widget must work offline and contain no references to local files or remote resources. Prefer drawings without external images. If the generated SVG references local images, embed supported image bytes as appropriate `data:` URLs before presenting it, or report that an offline preview cannot be produced. Do not fetch remote resources. Check the entire SVG for external references, including `href`, `url(...)`, fonts, and styles. Keep internal fragment references such as `url(#id)` intact.
3. Use the complete final `.chame` document as the source pane, not the SVG or a shortened excerpt. Escape `&`, `<`, and `>` as HTML text before inserting it into `<pre>`; never interpolate source into JavaScript or markup unescaped. Preserve line breaks and characters. Insert only trusted renderer-generated SVG as inline markup; do not include scripts, event-handler attributes, or executable content from source or assets. If the output cannot be made safe and self-contained, report the limitation rather than emitting a broken widget.

## Chat output

Return exactly one fenced code block whose language tag is `sci-widget`. Its contents must be a complete HTML document beginning with `<!DOCTYPE html>`. The widget itself is the chat deliverable; do not save it to disk or present a link to it. Do not add separate image or source-file attachments unless the user explicitly asks for them. Match the user's language in button labels and other visible text.

Use inline CSS and JavaScript only: no CDN, external scripts, links, images or fonts, network requests, local file URLs, or frameworks. Do not use viewport-height-dependent `html`/`body` sizing. Use a natural-height card, a preview pane around 480–560px high with `overflow: auto`, and a source pane with `max-height` and scrolling. Use a system font, light background, rounded borders, and a visible active state. Show preview by default. The two buttons switch between the inline SVG preview and the escaped complete source using `hidden` or `display`; no backend is needed.

For multiple canvases, embed each generated SVG in the same document in source order and provide in-widget buttons to select a canvas. If the document specifies animation, render frames in source order at the declared FPS with an inline timer; do not add automatic playback for non-animation variants. The source tab always shows the complete original document. Keep the widget self-contained in all cases.

The following is a structural template. Replace the two placeholders with the actual inline SVG and HTML-escaped Chamebrush source; placeholders must not appear in the final answer. Adapt visible labels to the user's language and extend the preview controls for multiple canvases when needed:

````text
```sci-widget
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; color: #173b3a; }
    .card { border: 1px solid #cbd9d7; border-radius: 12px; overflow: hidden; background: #fff; }
    nav { display: flex; gap: 8px; padding: 10px; border-bottom: 1px solid #dce6e4; }
    button { padding: 6px 12px; border: 1px solid #b7cbc7; border-radius: 7px; background: #f3f8f7; cursor: pointer; }
    button[aria-selected="true"] { border-color: #168a89; background: #dff4f0; }
    #preview { height: 520px; overflow: auto; padding: 12px; background: #edf3f1; box-sizing: border-box; }
    #preview svg { display: block; max-width: 100%; height: auto; margin: auto; }
    pre { margin: 0; padding: 16px; max-height: 520px; overflow: auto; white-space: pre-wrap; }
    [hidden] { display: none !important; }
  </style>
</head>
<body>
  <main class="card">
    <nav aria-label="视图切换">
      <button type="button" id="preview-tab" aria-selected="true">预览</button>
      <button type="button" id="source-tab" aria-selected="false">源码</button>
    </nav>
    <section id="preview">INLINE_SVG</section>
    <pre id="source" hidden><code>HTML_ESCAPED_CHAME_SOURCE</code></pre>
  </main>
  <script>
    const preview = document.getElementById('preview');
    const source = document.getElementById('source');
    const previewTab = document.getElementById('preview-tab');
    const sourceTab = document.getElementById('source-tab');
    function showPreview(show) {
      preview.hidden = !show;
      source.hidden = show;
      previewTab.setAttribute('aria-selected', String(show));
      sourceTab.setAttribute('aria-selected', String(!show));
    }
    previewTab.addEventListener('click', () => showPreview(true));
    sourceTab.addEventListener('click', () => showPreview(false));
  </script>
</body>
</html>
```
````
