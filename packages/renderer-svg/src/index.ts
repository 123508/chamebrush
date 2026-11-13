import type {
  Scene,
  SceneConnect,
  SceneNode,
  Stroke,
  SceneTransform,
} from "@chamebrush/core";

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function number(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
}

function strokeAttributes(stroke: Stroke | null): string {
  return stroke
    ? ` stroke="${escapeText(stroke.color)}" stroke-width="${number(stroke.width)}" stroke-linecap="${stroke.lineCap}" stroke-linejoin="${stroke.lineJoin}"`
    : " stroke=\"none\"";
}

function transformValue(transforms: SceneTransform[]): string {
  return transforms.map((transform) => {
    if (transform.kind === "translate") return `translate(${number(transform.offset.x)} ${number(transform.offset.y)})`;
    if (transform.kind === "rotate") return `rotate(${number(transform.angle)} ${number(transform.origin.x)} ${number(transform.origin.y)})`;
    return `translate(${number(transform.origin.x)} ${number(transform.origin.y)}) scale(${number(transform.scale.x)} ${number(transform.scale.y)}) translate(${number(-transform.origin.x)} ${number(-transform.origin.y)})`;
  }).join(" ");
}

function commonAttributes(node: SceneNode): string {
  const transform = node.transforms.length ? ` transform="${transformValue(node.transforms)}"` : "";
  const filter = node.shadow ? ` filter="url(#shadow-${escapeText(node.id)})"` : "";
  return ` id="${escapeText(node.id)}" opacity="${number(node.opacity)}"${transform}${filter}`;
}

function shadowDefinition(node: SceneNode): string {
  if (!node.shadow) return "";
  return `<defs><filter id="shadow-${escapeText(node.id)}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${number(node.shadow.offset.x)}" dy="${number(node.shadow.offset.y)}" stdDeviation="${number(node.shadow.blur / 2)}" flood-color="${escapeText(node.shadow.color)}" /></filter></defs>`;
}

function connectPath(node: SceneConnect): string {
  const { from, to } = node;
  if (node.route === "orthogonal" || node.route === "auto") {
    const middleX = (from.x + to.x) / 2;
    return `M ${number(from.x)} ${number(from.y)} L ${number(middleX)} ${number(from.y)} L ${number(middleX)} ${number(to.y)} L ${number(to.x)} ${number(to.y)}`;
  }
  if (node.route === "curved") {
    const distance = Math.max(40, Math.abs(to.x - from.x) / 2);
    const direction = to.x >= from.x ? 1 : -1;
    return `M ${number(from.x)} ${number(from.y)} C ${number(from.x + distance * direction)} ${number(from.y)} ${number(to.x - distance * direction)} ${number(to.y)} ${number(to.x)} ${number(to.y)}`;
  }
  return `M ${number(from.x)} ${number(from.y)} L ${number(to.x)} ${number(to.y)}`;
}

function renderNode(node: SceneNode, interactive: boolean): string {
  if (!node.visible) return "";
  if (interactive && node.opacity === 0 && node.kind === "group") return "";
  const hitTarget = interactive ? ` data-chame-id="${escapeText(node.id)}"` : "";
  const noHit = interactive && node.opacity === 0 ? ' pointer-events="none"' : "";
  const common = commonAttributes(node) + (noHit || hitTarget);
  const hitStroke = interactive && node.opacity !== 0
    ? `${hitTarget} data-chame-hit-area="" aria-hidden="true" fill="none" stroke="transparent" stroke-width="10" stroke-linecap="round" vector-effect="non-scaling-stroke" pointer-events="stroke"${node.transforms.length ? ` transform="${transformValue(node.transforms)}"` : ""}`
    : "";
  const shadow = shadowDefinition(node);
  switch (node.kind) {
    case "rect":
      return `${shadow}<rect${common} x="${number(node.bounds.x)}" y="${number(node.bounds.y)}" width="${number(node.bounds.width)}" height="${number(node.bounds.height)}" rx="${number(node.radius)}" fill="${escapeText(node.fill)}"${strokeAttributes(node.stroke)} />`;
    case "circle":
      return `${shadow}<circle${common} cx="${number(node.center.x)}" cy="${number(node.center.y)}" r="${number(node.radius)}" fill="${escapeText(node.fill)}"${strokeAttributes(node.stroke)} />`;
    case "ellipse":
      return `${shadow}<ellipse${common} cx="${number(node.center.x)}" cy="${number(node.center.y)}" rx="${number(node.radiusX)}" ry="${number(node.radiusY)}" fill="${escapeText(node.fill)}"${strokeAttributes(node.stroke)} />`;
    case "point":
      return `${shadow}<circle${common} cx="${number(node.at.x)}" cy="${number(node.at.y)}" r="${number(node.radius)}" fill="${escapeText(node.fill)}"${strokeAttributes(node.stroke)} />`;
    case "line": {
      const endpoints = ` x1="${number(node.from.x)}" y1="${number(node.from.y)}" x2="${number(node.to.x)}" y2="${number(node.to.y)}"`;
      const hitLine = hitStroke ? `<line${hitStroke}${endpoints} />` : "";
      return `${shadow}${hitLine}<line${common}${endpoints} stroke="${escapeText(node.color)}" stroke-width="${number(node.width)}" stroke-linecap="${node.lineCap}" />`;
    }
    case "polyline":
    case "polygon": {
      const points = node.points.map((point) => `${number(point.x)},${number(point.y)}`).join(" ");
      return `${shadow}<${node.kind}${common} points="${points}" fill="${escapeText(node.fill)}"${strokeAttributes(node.stroke)} />`;
    }
    case "path":
      return `${shadow}<path${common} d="${escapeText(node.data)}" fill="${escapeText(node.fill)}"${strokeAttributes(node.stroke)} />`;
    case "text": {
      const anchor = node.align === "center" ? "middle" : node.align === "right" ? "end" : "start";
      const baseline = node.verticalAlign === "middle" ? "middle" : node.verticalAlign === "top" ? "hanging" : node.verticalAlign === "bottom" ? "text-after-edge" : "alphabetic";
      const lines = node.lines.map((line, index) => `<tspan x="${number(node.at.x)}"${index === 0 ? "" : ` dy="${number(node.lineHeight)}em"`}>${escapeText(line)}</tspan>`).join("");
      return `${shadow}<text${common} x="${number(node.at.x)}" y="${number(node.at.y)}" fill="${escapeText(node.color)}" font-family="${escapeText(node.fontFamily)}" font-size="${number(node.fontSize)}" font-weight="${number(node.fontWeight)}" text-anchor="${anchor}" dominant-baseline="${baseline}">${lines}</text>`;
    }
    case "image": {
      const clipId = `clip-${node.id.replaceAll(/[^\p{L}\p{N}_-]/gu, "-")}`;
      const preserve = node.fit === "cover" ? "xMidYMid slice" : node.fit === "contain" ? "xMidYMid meet" : "none";
      const clip = node.radius > 0
        ? `<defs><clipPath id="${escapeText(clipId)}"><rect x="${number(node.bounds.x)}" y="${number(node.bounds.y)}" width="${number(node.bounds.width)}" height="${number(node.bounds.height)}" rx="${number(node.radius)}" /></clipPath></defs>`
        : "";
      const clipAttribute = node.radius > 0 ? ` clip-path="url(#${escapeText(clipId)})"` : "";
      return `${shadow}${clip}<image${common} href="${escapeText(node.source)}" x="${number(node.bounds.x)}" y="${number(node.bounds.y)}" width="${number(node.bounds.width)}" height="${number(node.bounds.height)}" preserveAspectRatio="${preserve}"${clipAttribute} />`;
    }
    case "connect": {
      const markerStart = node.arrow === "start" || node.arrow === "both" ? ' marker-start="url(#chame-arrow-start)"' : "";
      const markerEnd = node.arrow === "end" || node.arrow === "both" ? ' marker-end="url(#chame-arrow-end)"' : "";
      const data = connectPath(node);
      const hitPath = hitStroke ? `<path${hitStroke} d="${data}" />` : "";
      const path = `${shadow}${hitPath}<path${common} d="${data}" fill="none" stroke="${escapeText(node.color)}" stroke-width="${number(node.width)}"${markerStart}${markerEnd} />`;
      if (!node.label) return path;
      const labelX = node.from.x + (node.to.x - node.from.x) * node.labelPosition + node.labelOffset.x;
      const labelY = node.from.y + (node.to.y - node.from.y) * node.labelPosition + node.labelOffset.y;
      return `${path}<text${hitTarget} x="${number(labelX)}" y="${number(labelY)}" fill="${escapeText(node.color)}" font-family="sans-serif" font-size="13" text-anchor="middle" dominant-baseline="middle">${escapeText(node.label)}</text>`;
    }
    case "group":
      return `${shadow}<g${common}>${node.children.map((child) => renderNode(child, interactive)).join("")}</g>`;
  }
}

function render(scene: Scene, interactive: boolean): string {
  const background = scene.background === "transparent"
    ? ""
    : `<rect x="0" y="0" width="${number(scene.width)}" height="${number(scene.height)}" fill="${escapeText(scene.background)}" />`;
  const outlineFilter = interactive ? `
    <filter id="chame-preview-outline" filterUnits="userSpaceOnUse" x="0" y="0" width="${number(scene.width)}" height="${number(scene.height)}">
      <feComponentTransfer in="SourceAlpha" result="silhouette">
        <feFuncA type="linear" slope="255" />
      </feComponentTransfer>
      <feMorphology in="silhouette" operator="dilate" radius="2.5" result="expanded" />
      <feComposite in="expanded" in2="silhouette" operator="out" result="edge" />
      <feFlood flood-color="#818cf8" result="color" />
      <feComposite in="color" in2="edge" operator="in" />
    </filter>` : "";
  const definitions = `<defs>
    <marker id="chame-arrow-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker>
    <marker id="chame-arrow-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 10 0 L 0 5 L 10 10 z" fill="context-stroke" /></marker>
  ${outlineFilter}</defs>`;
  const children = scene.children.map((node) => renderNode(node, interactive)).join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${number(scene.width)}" height="${number(scene.height)}" viewBox="0 0 ${number(scene.width)} ${number(scene.height)}" role="img" aria-label="${escapeText(scene.name)}">
  ${definitions}
  ${background}
  ${children}
</svg>`;
}

export function renderSvg(scene: Scene): string {
  return render(scene, false);
}

/** Renders an inline SVG with hit targets for an interactive preview. */
export function renderPreviewSvg(scene: Scene): string {
  return render(scene, true);
}
