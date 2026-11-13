import { useLayoutEffect, useMemo, useRef } from "react";

interface PreviewProps {
  svg: string;
  selectedId: string | undefined;
}

const svgNamespace = "http://www.w3.org/2000/svg";

export function Preview({ svg, selectedId }: PreviewProps) {
  const drawing = useRef<HTMLDivElement>(null);
  const markup = useMemo(() => ({ __html: svg }), [svg]);

  useLayoutEffect(() => {
    const root = drawing.current?.querySelector("svg");
    if (!root || selectedId === undefined) return;
    const rootMatrix = root.getCTM();
    if (!rootMatrix) return;
    const targets = Array.from(root.querySelectorAll<SVGGraphicsElement>("[data-chame-id]:not([data-chame-hit-area])"))
      .filter((element) => element.getAttribute("data-chame-id") === selectedId);
    if (targets.length === 0) return;

    const outline = document.createElementNS(svgNamespace, "g");
    outline.setAttribute("filter", "url(#chame-preview-outline)");
    outline.setAttribute("aria-hidden", "true");
    outline.setAttribute("pointer-events", "none");

    for (const target of targets) {
      const matrix = target.getCTM();
      if (!matrix) continue;
      const copy = target.cloneNode(true) as SVGGraphicsElement;
      // Lift the geometry above the drawing, keeping its position and shape in root SVG coordinates.
      copy.setAttribute("transform", rootMatrix.inverse().multiply(matrix).toString());
      for (const child of copy.querySelectorAll("defs, [data-chame-hit-area]")) child.remove();
      for (const element of [copy, ...copy.querySelectorAll("[id], [filter], [data-chame-id]")]) {
        element.removeAttribute("id");
        element.removeAttribute("filter");
        element.removeAttribute("data-chame-id");
      }
      outline.append(copy);
    }
    root.append(outline);
    return () => outline.remove();
  }, [svg, selectedId]);

  return <div className="svg-preview" ref={drawing} dangerouslySetInnerHTML={markup} />;
}
