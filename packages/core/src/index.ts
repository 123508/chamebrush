import {
  parse,
  type CommandNode,
  type Diagnostic,
  type DocumentNode,
  type LetNode,
  type ObjectNode,
  type SourceRange,
  type ValueNode,
} from "@chamebrush/language";

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Stroke {
  color: string;
  width: number;
  lineCap: "butt" | "round" | "square";
  lineJoin: "miter" | "round" | "bevel";
}

export interface Shadow {
  offset: Point;
  blur: number;
  color: string;
}

export type SceneTransform =
  | { kind: "translate"; offset: Point }
  | { kind: "rotate"; angle: number; origin: Point }
  | { kind: "scale"; scale: Point; origin: Point };

export interface SceneBase {
  id: string;
  opacity: number;
  visible: boolean;
  transforms: SceneTransform[];
  shadow: Shadow | null;
}

export interface SceneRect extends SceneBase {
  kind: "rect";
  bounds: Bounds;
  radius: number;
  fill: string;
  stroke: Stroke | null;
}

export interface SceneCircle extends SceneBase {
  kind: "circle";
  center: Point;
  radius: number;
  fill: string;
  stroke: Stroke | null;
}

export interface SceneEllipse extends SceneBase {
  kind: "ellipse";
  center: Point;
  radiusX: number;
  radiusY: number;
  fill: string;
  stroke: Stroke | null;
}

export interface SceneLine extends SceneBase {
  kind: "line";
  from: Point;
  to: Point;
  color: string;
  width: number;
  lineCap: "butt" | "round" | "square";
}

export interface ScenePolyline extends SceneBase {
  kind: "polyline" | "polygon";
  points: Point[];
  fill: string;
  stroke: Stroke | null;
}

export interface ScenePath extends SceneBase {
  kind: "path";
  data: string;
  fill: string;
  stroke: Stroke | null;
}

export interface SceneText extends SceneBase {
  kind: "text";
  at: Point;
  content: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom" | "baseline";
  lines: string[];
  lineHeight: number;
  maxWidth: number | null;
}

export interface SceneImage extends SceneBase {
  kind: "image";
  source: string;
  bounds: Bounds;
  fit: "contain" | "cover" | "fill" | "none";
  radius: number;
}

export interface SceneConnect extends SceneBase {
  kind: "connect";
  from: Point;
  to: Point;
  route: "straight" | "orthogonal" | "curved" | "auto";
  arrow: "none" | "start" | "end" | "both";
  color: string;
  width: number;
  label: string;
  labelPosition: number;
  labelOffset: Point;
}

export interface ScenePoint extends SceneBase {
  kind: "point";
  at: Point;
  radius: number;
  fill: string;
  stroke: Stroke | null;
}

export interface SceneGroup extends SceneBase {
  kind: "group";
  children: SceneNode[];
}

export type SceneNode =
  | SceneRect
  | SceneCircle
  | SceneEllipse
  | SceneLine
  | ScenePolyline
  | ScenePath
  | SceneText
  | SceneImage
  | SceneConnect
  | ScenePoint
  | SceneGroup;

export interface Scene {
  name: string;
  width: number;
  height: number;
  background: string;
  children: SceneNode[];
}

export type CompileResult =
  | { ok: true; scene: Scene; diagnostics: Diagnostic[] }
  | { ok: false; diagnostics: Diagnostic[] };

export interface AnimationSettings {
  fps: number;
}

export type CompileAllResult =
  | { ok: true; scenes: Scene[]; animation?: AnimationSettings; diagnostics: Diagnostic[] }
  | { ok: false; diagnostics: Diagnostic[] };

interface Percentage {
  kind: "percentage";
  value: number;
}

interface Pair {
  x: RuntimeScalar;
  y: RuntimeScalar;
}

type RuntimeScalar = number | string | boolean | Percentage;
type RuntimeValue = RuntimeScalar | Pair | RuntimeValue[];

interface RegistryEntry {
  bounds: Bounds;
  anchors: Map<string, Point>;
}

interface CompileContext {
  variables: Map<string, RuntimeValue>;
  registry: Map<string, RegistryEntry>;
  diagnostics: Diagnostic[];
  scope: string[];
  offset: Point;
}

class CompileFailure extends Error {
  constructor(
    message: string,
    readonly range: SourceRange,
  ) {
    super(message);
  }
}

function command(object: ObjectNode, name: string): CommandNode | undefined {
  return object.members.find(
    (member): member is CommandNode => member.kind === "command" && member.name === name,
  );
}

function requiredCommand(object: ObjectNode, name: string): CommandNode {
  const found = command(object, name);
  if (!found) throw new CompileFailure(`${object.objectType}“${object.name}”缺少命令“${name}”`, object.range);
  return found;
}

function ensureArg(commandNode: CommandNode, index: number): ValueNode {
  const argument = commandNode.arguments[index];
  if (!argument) throw new CompileFailure(`命令“${commandNode.name}”缺少第 ${index + 1} 个参数`, commandNode.range);
  return argument;
}

function expectArgCount(commandNode: CommandNode, minimum: number, maximum = minimum): void {
  if (commandNode.arguments.length < minimum || commandNode.arguments.length > maximum) {
    const expected = minimum === maximum ? `${minimum}` : `${minimum}–${maximum}`;
    throw new CompileFailure(`命令“${commandNode.name}”需要 ${expected} 个参数`, commandNode.range);
  }
}

const commonCommands = new Set(["opacity", "visible", "translate", "rotate", "scale", "origin", "anchor", "shadow"]);
const paintCommands = new Set(["fill", "stroke", "line-cap", "line-join"]);
const allowedCommands: Record<string, Set<string>> = {
  point: new Set(["at", "radius", ...commonCommands, ...paintCommands]),
  line: new Set(["from", "to", "color", "width", "line-cap", ...commonCommands]),
  polyline: new Set(["points", ...commonCommands, ...paintCommands]),
  rect: new Set(["at", "size", "round", ...commonCommands, ...paintCommands]),
  circle: new Set(["center", "radius", ...commonCommands, ...paintCommands]),
  ellipse: new Set(["center", "radius-x", "radius-y", ...commonCommands, ...paintCommands]),
  triangle: new Set(["points", ...commonCommands, ...paintCommands]),
  polygon: new Set(["points", ...commonCommands, ...paintCommands]),
  path: new Set(["move", "line", "quad", "curve", "close", ...commonCommands, ...paintCommands]),
  text: new Set(["content", "at", "color", "font", "font-size", "font-weight", "align", "vertical-align", "line-height", "max-width", "wrap", ...commonCommands]),
  image: new Set(["source", "at", "size", "fit", "round", ...commonCommands]),
  connect: new Set(["from", "to", "route", "arrow", "color", "width", "line-cap", "label", "label-position", "label-offset", ...commonCommands]),
  group: new Set(["at", ...commonCommands]),
};

const commandArgCounts: Record<string, [number, number]> = {
  at: [1, 1], size: [1, 1], center: [1, 1], from: [1, 1], to: [1, 1], points: [1, 1],
  radius: [1, 1], "radius-x": [1, 1], "radius-y": [1, 1], fill: [1, 1], stroke: [1, 2], round: [1, 1],
  color: [1, 1], width: [1, 1], content: [1, 1], font: [1, 1], "font-size": [1, 1], "font-weight": [1, 1],
  align: [1, 1], "vertical-align": [1, 1], "line-height": [1, 1], "max-width": [1, 1], wrap: [1, 1],
  source: [1, 1], fit: [1, 1], route: [1, 1], arrow: [1, 1], label: [1, 1], "label-position": [1, 1], "label-offset": [1, 1],
  opacity: [1, 1], visible: [1, 1], "line-cap": [1, 1], "line-join": [1, 1], shadow: [3, 3],
  translate: [1, 1], rotate: [1, 1], scale: [1, 1], origin: [1, 1], anchor: [2, 2],
  move: [1, 1], line: [1, 1], quad: [2, 2], curve: [3, 3], close: [0, 0],
};

function validateCommands(object: ObjectNode): void {
  const allowed = allowedCommands[object.objectType];
  if (!allowed) throw new CompileFailure(`不支持的对象类型“${object.objectType}”`, object.range);
  const seen = new Set<string>();
  for (const member of object.members) {
    if (member.kind !== "command") continue;
    if (!allowed.has(member.name)) throw new CompileFailure(`${object.objectType}“${object.name}”不支持命令“${member.name}”`, member.range);
    const count = commandArgCounts[member.name];
    if (count) expectArgCount(member, count[0], count[1]);
    if (!(["move", "line", "quad", "curve", "anchor", "translate", "rotate", "scale", "origin"].includes(member.name)) && seen.has(member.name)) {
      throw new CompileFailure(`命令“${member.name}”不能重复`, member.range);
    }
    seen.add(member.name);
  }
}

function fullName(scope: string[], name: string): string {
  return [...scope, name].join(".");
}

function anchorOf(bounds: Bounds, name: string): Point | undefined {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const anchors: Record<string, Point> = {
    left: { x: bounds.x, y: centerY },
    right: { x: bounds.x + bounds.width, y: centerY },
    top: { x: centerX, y: bounds.y },
    bottom: { x: centerX, y: bounds.y + bounds.height },
    center: { x: centerX, y: centerY },
    "top-left": { x: bounds.x, y: bounds.y },
    "top-right": { x: bounds.x + bounds.width, y: bounds.y },
    "bottom-left": { x: bounds.x, y: bounds.y + bounds.height },
    "bottom-right": { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  };
  return anchors[name];
}

function resolveReference(path: string[], context: CompileContext, range: SourceRange): RuntimeValue {
  if (path.length === 1) {
    const variable = context.variables.get(path[0]!);
    return variable ?? path[0]!;
  }

  const axis = path.at(-1);
  const hasAxis = axis === "x" || axis === "y";
  const anchorName = path.at(hasAxis ? -2 : -1)!;
  const objectParts = path.slice(0, hasAxis ? -2 : -1);
  const candidates = [objectParts.join(".")];
  for (let depth = context.scope.length; depth >= 0; depth -= 1) {
    candidates.push([...context.scope.slice(0, depth), ...objectParts].join("."));
  }

  const objectName = candidates.find((candidate) => context.registry.has(candidate));
  if (!objectName) throw new CompileFailure(`无法找到对象“${objectParts.join(".")}”`, range);
  const entry = context.registry.get(objectName)!;
  const absolute = entry.anchors.get(anchorName) ?? anchorOf(entry.bounds, anchorName);
  if (!absolute) throw new CompileFailure(`对象“${objectName}”没有锚点“${anchorName}”`, range);

  const local = { x: absolute.x - context.offset.x, y: absolute.y - context.offset.y };
  return hasAxis ? local[axis] : local;
}

function evaluate(node: ValueNode, context: CompileContext): RuntimeValue {
  switch (node.kind) {
    case "number":
      return node.unit === "%" ? { kind: "percentage", value: node.value / 100 } : node.value;
    case "string":
    case "boolean":
      return node.value;
    case "reference":
      return resolveReference(node.path, context, node.range);
    case "tuple": {
      if (node.items.length !== 2) throw new CompileFailure("坐标必须包含两个值", node.range);
      return {
        x: evaluate(node.items[0]!, context) as RuntimeScalar,
        y: evaluate(node.items[1]!, context) as RuntimeScalar,
      };
    }
    case "list":
      return node.items.map((item) => evaluate(item, context));
    case "unary": {
      const value = evaluate(node.value, context);
      if (typeof value !== "number") throw new CompileFailure("一元运算只能用于数字", node.range);
      return node.operator === "-" ? -value : value;
    }
    case "binary": {
      const left = evaluate(node.left, context);
      const right = evaluate(node.right, context);
      if (typeof left === "number" && typeof right === "number") {
        if (node.operator === "+") return left + right;
        if (node.operator === "-") return left - right;
        if (node.operator === "*") return left * right;
        if (right === 0) throw new CompileFailure("除数不能为零", node.range);
        return left / right;
      }
      if (isPair(left) && isPair(right) && (node.operator === "+" || node.operator === "-")) {
        const lx = numericScalar(left.x, node.range);
        const ly = numericScalar(left.y, node.range);
        const rx = numericScalar(right.x, node.range);
        const ry = numericScalar(right.y, node.range);
        return node.operator === "+"
          ? { x: lx + rx, y: ly + ry }
          : { x: lx - rx, y: ly - ry };
      }
      throw new CompileFailure(`运算符“${node.operator}”两侧类型不兼容`, node.range);
    }
  }
}

function isPair(value: RuntimeValue): value is Pair {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !("kind" in value);
}

function isPercentage(value: RuntimeScalar): value is Percentage {
  return typeof value === "object" && value !== null && "kind" in value && value.kind === "percentage";
}

function numericScalar(value: RuntimeScalar, range: SourceRange): number {
  if (typeof value !== "number") throw new CompileFailure("这里需要数字", range);
  return value;
}

function evaluatePoint(value: ValueNode, context: CompileContext): Point {
  const evaluated = evaluate(value, context);
  if (!isPair(evaluated)) throw new CompileFailure("这里需要二维坐标", value.range);
  return {
    x: numericScalar(evaluated.x, value.range),
    y: numericScalar(evaluated.y, value.range),
  };
}

function pointArg(commandNode: CommandNode, context: CompileContext): Point {
  return evaluatePoint(ensureArg(commandNode, 0), context);
}

function numberArg(commandNode: CommandNode, context: CompileContext, index = 0): number {
  const node = ensureArg(commandNode, index);
  return numericScalar(evaluate(node, context) as RuntimeScalar, node.range);
}

function stringArg(commandNode: CommandNode, context: CompileContext, index = 0): string {
  const node = ensureArg(commandNode, index);
  const value = evaluate(node, context);
  if (typeof value !== "string") throw new CompileFailure("这里需要文本值", node.range);
  return value;
}

function enumArg<T extends string>(commandNode: CommandNode, context: CompileContext, values: readonly T[]): T {
  const value = stringArg(commandNode, context);
  if (!values.includes(value as T)) throw new CompileFailure(`命令“${commandNode.name}”的值“${value}”无效，可选值：${values.join("、")}`, commandNode.range);
  return value as T;
}

function booleanArg(commandNode: CommandNode, context: CompileContext): boolean {
  const node = ensureArg(commandNode, 0);
  const value = evaluate(node, context);
  if (typeof value !== "boolean") throw new CompileFailure("这里需要 true 或 false", node.range);
  return value;
}

function opacityOf(object: ObjectNode, context: CompileContext): number {
  const found = command(object, "opacity");
  if (!found) return 1;
  const node = ensureArg(found, 0);
  const value = evaluate(node, context);
  const result = isPercentage(value as RuntimeScalar)
    ? (value as Percentage).value
    : numericScalar(value as RuntimeScalar, node.range);
  if (result < 0 || result > 1) throw new CompileFailure("透明度必须在 0 到 1 之间", node.range);
  return result;
}

function visibleOf(object: ObjectNode, context: CompileContext): boolean {
  const found = command(object, "visible");
  return found ? booleanArg(found, context) : true;
}

function fillOf(object: ObjectNode, context: CompileContext, fallback = "none"): string {
  const found = command(object, "fill");
  return found ? stringArg(found, context) : fallback;
}

function strokeOf(object: ObjectNode, context: CompileContext): Stroke | null {
  const found = command(object, "stroke");
  if (!found) return null;
  const color = stringArg(found, context);
  if (color === "none") return null;
  const width = found.arguments.length > 1 ? numberArg(found, context, 1) : 1;
  if (width < 0) throw new CompileFailure("描边宽度不能为负数", found.range);
  const lineCapCommand = command(object, "line-cap");
  const lineJoinCommand = command(object, "line-join");
  return {
    color,
    width,
    lineCap: lineCapCommand ? enumArg(lineCapCommand, context, ["butt", "round", "square"] as const) : "butt",
    lineJoin: lineJoinCommand ? enumArg(lineJoinCommand, context, ["miter", "round", "bevel"] as const) : "miter",
  };
}

function originOf(node: ValueNode, bounds: Bounds, context: CompileContext): Point {
  if (node.kind === "reference" && node.path.length === 1) {
    const anchor = anchorOf(bounds, node.path[0]!);
    if (anchor) return anchor;
  }
  return absolutePoint(evaluatePoint(node, context), context);
}

function transformsOf(object: ObjectNode, bounds: Bounds, context: CompileContext): SceneTransform[] {
  const transforms: SceneTransform[] = [];
  let origin = anchorOf(bounds, "center")!;
  for (const member of object.members) {
    if (member.kind !== "command") continue;
    if (member.name === "origin") {
      origin = originOf(ensureArg(member, 0), bounds, context);
    } else if (member.name === "translate") {
      transforms.push({ kind: "translate", offset: pointArg(member, context) });
    } else if (member.name === "rotate") {
      transforms.push({ kind: "rotate", angle: numberArg(member, context), origin });
    } else if (member.name === "scale") {
      const value = evaluate(ensureArg(member, 0), context);
      if (typeof value === "number") transforms.push({ kind: "scale", scale: { x: value, y: value }, origin });
      else if (isPair(value)) transforms.push({ kind: "scale", scale: { x: numericScalar(value.x, member.range), y: numericScalar(value.y, member.range) }, origin });
      else throw new CompileFailure("scale 需要数字或二维元组", member.range);
    }
  }
  return transforms;
}

function shadowOf(object: ObjectNode, context: CompileContext): Shadow | null {
  const found = command(object, "shadow");
  if (!found) return null;
  const blur = numberArg(found, context, 1);
  if (blur < 0) throw new CompileFailure("阴影模糊半径不能为负数", found.range);
  return { offset: pointArg(found, context), blur, color: stringArg(found, context, 2) };
}

function baseOf(object: ObjectNode, id: string, context: CompileContext, bounds: Bounds): SceneBase {
  return {
    id,
    opacity: opacityOf(object, context),
    visible: visibleOf(object, context),
    transforms: transformsOf(object, bounds, context),
    shadow: shadowOf(object, context),
  };
}

function absolutePoint(local: Point, context: CompileContext): Point {
  return { x: local.x + context.offset.x, y: local.y + context.offset.y };
}

function transformPoint(point: Point, transforms: SceneTransform[]): Point {
  return transforms.reduce((current, transform) => {
    if (transform.kind === "translate") return { x: current.x + transform.offset.x, y: current.y + transform.offset.y };
    if (transform.kind === "scale") return {
      x: transform.origin.x + (current.x - transform.origin.x) * transform.scale.x,
      y: transform.origin.y + (current.y - transform.origin.y) * transform.scale.y,
    };
    const radians = transform.angle * Math.PI / 180;
    const dx = current.x - transform.origin.x;
    const dy = current.y - transform.origin.y;
    return {
      x: transform.origin.x + dx * Math.cos(radians) - dy * Math.sin(radians),
      y: transform.origin.y + dx * Math.sin(radians) + dy * Math.cos(radians),
    };
  }, point);
}

function transformBounds(bounds: Bounds, transforms: SceneTransform[]): Bounds {
  return boundsFromPoints([
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ].map((point) => transformPoint(point, transforms)));
}

function boundsFromPoints(points: Point[]): Bounds {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function unionBounds(bounds: Bounds[]): Bounds {
  if (bounds.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  return boundsFromPoints(bounds.flatMap((item) => [
    { x: item.x, y: item.y },
    { x: item.x + item.width, y: item.y + item.height },
  ]));
}

function register(object: ObjectNode, id: string, bounds: Bounds, context: CompileContext): void {
  const anchors = new Map<string, Point>();
  const transforms = transformsOf(object, bounds, context);
  for (const member of object.members) {
    if (member.kind !== "command" || member.name !== "anchor") continue;
    const nameNode = ensureArg(member, 0);
    const positionNode = ensureArg(member, 1);
    const name = stringArg(member, context, 0);
    const value = evaluate(positionNode, context);
    if (!isPair(value)) throw new CompileFailure("自定义锚点需要二维坐标", positionNode.range);
    const resolveCoordinate = (coordinate: RuntimeScalar, start: number, length: number): number =>
      isPercentage(coordinate) ? start + coordinate.value * length : start + numericScalar(coordinate, positionNode.range);
    anchors.set(name, transformPoint({
      x: resolveCoordinate(value.x, bounds.x, bounds.width),
      y: resolveCoordinate(value.y, bounds.y, bounds.height),
    }, transforms));
    void nameNode;
  }
  context.registry.set(id, { bounds: transformBounds(bounds, transforms), anchors });
}

function compileLet(node: LetNode, context: CompileContext): void {
  if (context.variables.has(node.name)) throw new CompileFailure(`变量“${node.name}”重复声明`, node.range);
  context.variables.set(node.name, evaluate(node.value, context));
}

function wrapText(content: string, maxWidth: number | null, fontSize: number, mode: "word" | "character" | "none"): string[] {
  const sourceLines = content.split("\n");
  if (mode === "none" || maxWidth === null) return sourceLines;
  const capacity = Math.max(1, Math.floor(maxWidth / (fontSize * 0.6)));
  return sourceLines.flatMap((sourceLine) => {
    if (sourceLine.length <= capacity) return [sourceLine];
    const chunks: string[] = [];
    if (mode === "character") {
      for (let index = 0; index < sourceLine.length; index += capacity) chunks.push(sourceLine.slice(index, index + capacity));
      return chunks;
    }
    let current = "";
    for (const word of sourceLine.split(/(\s+)/)) {
      if (current && current.length + word.length > capacity) {
        chunks.push(current.trimEnd());
        current = word.trimStart();
      } else {
        current += word;
      }
    }
    if (current || chunks.length === 0) chunks.push(current);
    return chunks;
  });
}

function compileObject(object: ObjectNode, context: CompileContext): { node: SceneNode; bounds: Bounds } {
  const id = fullName(context.scope, object.name);
  if (context.registry.has(id)) throw new CompileFailure(`对象“${id}”重复声明`, object.range);
  validateCommands(object);

  for (const member of object.members) {
    if (member.kind === "let") compileLet(member, context);
  }

  const atAbsolute = (name: string): Point => absolutePoint(pointArg(requiredCommand(object, name), context), context);
  let sceneNode: SceneNode;
  let bounds: Bounds;

  switch (object.objectType) {
    case "rect": {
      const at = atAbsolute("at");
      const size = pointArg(requiredCommand(object, "size"), context);
      if (size.x < 0 || size.y < 0) throw new CompileFailure("矩形尺寸不能为负数", object.range);
      bounds = { x: at.x, y: at.y, width: size.x, height: size.y };
      const radius = command(object, "round") ? numberArg(command(object, "round")!, context) : 0;
      if (radius < 0) throw new CompileFailure("圆角半径不能为负数", object.range);
      sceneNode = {
        kind: "rect",
        ...baseOf(object, id, context, bounds),
        bounds,
        radius,
        fill: fillOf(object, context),
        stroke: strokeOf(object, context),
      };
      break;
    }
    case "circle": {
      const center = atAbsolute("center");
      const radius = numberArg(requiredCommand(object, "radius"), context);
      if (radius < 0) throw new CompileFailure("圆的半径不能为负数", object.range);
      bounds = { x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2 };
      sceneNode = { kind: "circle", ...baseOf(object, id, context, bounds), center, radius, fill: fillOf(object, context), stroke: strokeOf(object, context) };
      break;
    }
    case "ellipse": {
      const center = atAbsolute("center");
      const radiusX = numberArg(requiredCommand(object, "radius-x"), context);
      const radiusY = numberArg(requiredCommand(object, "radius-y"), context);
      if (radiusX < 0 || radiusY < 0) throw new CompileFailure("椭圆半径不能为负数", object.range);
      bounds = { x: center.x - radiusX, y: center.y - radiusY, width: radiusX * 2, height: radiusY * 2 };
      sceneNode = { kind: "ellipse", ...baseOf(object, id, context, bounds), center, radiusX, radiusY, fill: fillOf(object, context), stroke: strokeOf(object, context) };
      break;
    }
    case "point": {
      const at = atAbsolute("at");
      const radius = command(object, "radius") ? numberArg(command(object, "radius")!, context) : 0;
      if (radius < 0) throw new CompileFailure("点的半径不能为负数", object.range);
      bounds = { x: at.x - radius, y: at.y - radius, width: radius * 2, height: radius * 2 };
      sceneNode = { kind: "point", ...baseOf(object, id, context, bounds), at, radius, fill: fillOf(object, context, "black"), stroke: strokeOf(object, context) };
      break;
    }
    case "line": {
      const from = atAbsolute("from");
      const to = atAbsolute("to");
      bounds = boundsFromPoints([from, to]);
      const width = command(object, "width") ? numberArg(command(object, "width")!, context) : 1;
      if (width < 0) throw new CompileFailure("线宽不能为负数", object.range);
      const lineCap = command(object, "line-cap") ? enumArg(command(object, "line-cap")!, context, ["butt", "round", "square"] as const) : "butt";
      sceneNode = {
        kind: "line",
        ...baseOf(object, id, context, bounds),
        from,
        to,
        color: command(object, "color") ? stringArg(command(object, "color")!, context) : "black",
        width,
        lineCap,
      };
      break;
    }
    case "polyline":
    case "polygon":
    case "triangle": {
      const pointsCommand = requiredCommand(object, "points");
      const listNode = ensureArg(pointsCommand, 0);
      const value = evaluate(listNode, context);
      if (!Array.isArray(value)) throw new CompileFailure("points 需要坐标列表", listNode.range);
      const points = value.map((item) => {
        if (!isPair(item)) throw new CompileFailure("points 中的项目必须是坐标", listNode.range);
        return absolutePoint({ x: numericScalar(item.x, listNode.range), y: numericScalar(item.y, listNode.range) }, context);
      });
      const minimum = object.objectType === "polyline" ? 2 : 3;
      if (points.length < minimum || (object.objectType === "triangle" && points.length !== 3)) {
        throw new CompileFailure(`${object.objectType} 的点数量不正确`, listNode.range);
      }
      bounds = boundsFromPoints(points);
      sceneNode = {
        kind: object.objectType === "polyline" ? "polyline" : "polygon",
        ...baseOf(object, id, context, bounds),
        points,
        fill: fillOf(object, context),
        stroke: strokeOf(object, context),
      };
      break;
    }
    case "path": {
      const data: string[] = [];
      const pathPoints: Point[] = [];
      for (const member of object.members) {
        if (member.kind !== "command") continue;
        if (member.name === "move" || member.name === "line") {
          const point = absolutePoint(pointArg(member, context), context);
          pathPoints.push(point);
          data.push(`${member.name === "move" ? "M" : "L"} ${point.x} ${point.y}`);
        } else if (member.name === "quad") {
          const control = absolutePoint(evaluatePoint(ensureArg(member, 0), context), context);
          const end = absolutePoint(evaluatePoint(ensureArg(member, 1), context), context);
          pathPoints.push(control, end);
          data.push(`Q ${control.x} ${control.y} ${end.x} ${end.y}`);
        } else if (member.name === "curve") {
          const first = absolutePoint(evaluatePoint(ensureArg(member, 0), context), context);
          const second = absolutePoint(evaluatePoint(ensureArg(member, 1), context), context);
          const end = absolutePoint(evaluatePoint(ensureArg(member, 2), context), context);
          pathPoints.push(first, second, end);
          data.push(`C ${first.x} ${first.y} ${second.x} ${second.y} ${end.x} ${end.y}`);
        } else if (member.name === "close") {
          data.push("Z");
        }
      }
      if (!data[0]?.startsWith("M")) throw new CompileFailure("path 的第一个几何命令必须是 move", object.range);
      bounds = boundsFromPoints(pathPoints);
      sceneNode = { kind: "path", ...baseOf(object, id, context, bounds), data: data.join(" "), fill: fillOf(object, context), stroke: strokeOf(object, context) };
      break;
    }
    case "text": {
      const at = atAbsolute("at");
      const content = stringArg(requiredCommand(object, "content"), context);
      const fontSize = command(object, "font-size") ? numberArg(command(object, "font-size")!, context) : 16;
      if (fontSize < 0) throw new CompileFailure("字号不能为负数", object.range);
      const align = command(object, "align") ? enumArg(command(object, "align")!, context, ["left", "center", "right"] as const) : "left";
      const verticalAlign = command(object, "vertical-align") ? enumArg(command(object, "vertical-align")!, context, ["top", "middle", "bottom", "baseline"] as const) : "baseline";
      const lineHeight = command(object, "line-height") ? numberArg(command(object, "line-height")!, context) : 1.2;
      const maxWidth = command(object, "max-width") ? numberArg(command(object, "max-width")!, context) : null;
      if (lineHeight <= 0 || (maxWidth !== null && maxWidth <= 0)) throw new CompileFailure("文本行高和最大宽度必须大于零", object.range);
      const wrap = command(object, "wrap") ? enumArg(command(object, "wrap")!, context, ["word", "character", "none"] as const) : "none";
      const lines = wrapText(content, maxWidth, fontSize, wrap);
      const estimatedWidth = Math.min(maxWidth ?? Infinity, Math.max(0, ...lines.map((line) => line.length * fontSize * 0.6)));
      const x = align === "center" ? at.x - estimatedWidth / 2 : align === "right" ? at.x - estimatedWidth : at.x;
      const y = verticalAlign === "middle" ? at.y - fontSize / 2 : verticalAlign === "bottom" ? at.y - fontSize : at.y;
      bounds = { x, y, width: estimatedWidth, height: fontSize * lineHeight * lines.length };
      sceneNode = {
        kind: "text",
        ...baseOf(object, id, context, bounds),
        at,
        content,
        color: command(object, "color") ? stringArg(command(object, "color")!, context) : "black",
        fontFamily: command(object, "font") ? stringArg(command(object, "font")!, context) : "sans-serif",
        fontSize,
        fontWeight: command(object, "font-weight") ? numberArg(command(object, "font-weight")!, context) : 400,
        align,
        verticalAlign,
        lines,
        lineHeight,
        maxWidth,
      };
      break;
    }
    case "image": {
      const at = atAbsolute("at");
      const size = pointArg(requiredCommand(object, "size"), context);
      if (size.x < 0 || size.y < 0) throw new CompileFailure("图片尺寸不能为负数", object.range);
      const source = stringArg(requiredCommand(object, "source"), context);
      if (/^\/\//.test(source) || (/^[a-z][a-z0-9+.-]*:/i.test(source) && !source.startsWith("data:"))) {
        throw new CompileFailure("图片 source 不允许使用远程 URL", requiredCommand(object, "source").range);
      }
      const radius = command(object, "round") ? numberArg(command(object, "round")!, context) : 0;
      if (radius < 0) throw new CompileFailure("圆角半径不能为负数", object.range);
      bounds = { x: at.x, y: at.y, width: size.x, height: size.y };
      sceneNode = {
        kind: "image",
        ...baseOf(object, id, context, bounds),
        source,
        bounds,
        fit: command(object, "fit") ? enumArg(command(object, "fit")!, context, ["contain", "cover", "fill", "none"] as const) : "contain",
        radius,
      };
      break;
    }
    case "connect": {
      const from = atAbsolute("from");
      const to = atAbsolute("to");
      const labelPositionCommand = command(object, "label-position");
      let labelPosition = 0.5;
      if (labelPositionCommand) {
        const value = evaluate(ensureArg(labelPositionCommand, 0), context);
        labelPosition = isPercentage(value as RuntimeScalar)
          ? (value as Percentage).value
          : numericScalar(value as RuntimeScalar, labelPositionCommand.range);
      }
      if (labelPosition < 0 || labelPosition > 1) throw new CompileFailure("label-position 必须在 0 到 1 之间", labelPositionCommand?.range ?? object.range);
      bounds = boundsFromPoints([from, to]);
      const width = command(object, "width") ? numberArg(command(object, "width")!, context) : 1;
      if (width < 0) throw new CompileFailure("线宽不能为负数", object.range);
      sceneNode = {
        kind: "connect",
        ...baseOf(object, id, context, bounds),
        from,
        to,
        route: command(object, "route") ? enumArg(command(object, "route")!, context, ["straight", "orthogonal", "curved", "auto"] as const) : "straight",
        arrow: command(object, "arrow") ? enumArg(command(object, "arrow")!, context, ["none", "start", "end", "both"] as const) : "none",
        color: command(object, "color") ? stringArg(command(object, "color")!, context) : "black",
        width,
        label: command(object, "label") ? stringArg(command(object, "label")!, context) : "",
        labelPosition,
        labelOffset: command(object, "label-offset") ? pointArg(command(object, "label-offset")!, context) : { x: 0, y: 0 },
      };
      break;
    }
    case "group": {
      const localAt = command(object, "at") ? pointArg(command(object, "at")!, context) : { x: 0, y: 0 };
      const childContext: CompileContext = {
        ...context,
        variables: new Map(context.variables),
        scope: [...context.scope, object.name],
        offset: absolutePoint(localAt, context),
      };
      const compiledChildren = object.members
        .filter((member): member is ObjectNode => member.kind === "object")
        .map((child) => compileObject(child, childContext));
      bounds = unionBounds(compiledChildren.map((item) => item.bounds));
      sceneNode = {
        kind: "group",
        ...baseOf(object, id, context, bounds),
        children: compiledChildren.map((item) => item.node),
      };
      break;
    }
    default:
      throw new CompileFailure(`不支持的对象类型“${object.objectType}”`, object.range);
  }

  if (sceneNode.kind === "group" && sceneNode.transforms.length > 0) {
    for (const [name, entry] of context.registry) {
      if (!name.startsWith(`${id}.`)) continue;
      entry.bounds = transformBounds(entry.bounds, sceneNode.transforms);
      entry.anchors = new Map([...entry.anchors].map(([anchorName, point]) => [anchorName, transformPoint(point, sceneNode.transforms)]));
    }
  }
  register(object, id, bounds, context);
  return { node: sceneNode, bounds };
}

function compileCanvas(canvas: ObjectNode, globalContext: CompileContext): CompileResult {
  const diagnostics: Diagnostic[] = [];
  try {
    const allowed = new Set(["size", "background"]);
    const seen = new Set<string>();
    for (const member of canvas.members) {
      if (member.kind !== "command") continue;
      if (!allowed.has(member.name)) throw new CompileFailure(`canvas“${canvas.name}”不支持命令“${member.name}”`, member.range);
      expectArgCount(member, 1);
      if (seen.has(member.name)) throw new CompileFailure(`命令“${member.name}”不能重复`, member.range);
      seen.add(member.name);
    }
    const canvasContext: CompileContext = {
      ...globalContext,
      diagnostics,
      registry: new Map(),
      variables: new Map(globalContext.variables),
      scope: [],
      offset: { x: 0, y: 0 },
    };
    for (const member of canvas.members) {
      if (member.kind === "let") compileLet(member, canvasContext);
    }
    const size = pointArg(requiredCommand(canvas, "size"), canvasContext);
    if (size.x <= 0 || size.y <= 0) throw new CompileFailure("画布尺寸必须大于零", canvas.range);
    const backgroundCommand = command(canvas, "background");
    const children = canvas.members
      .filter((member): member is ObjectNode => member.kind === "object")
      .map((object) => compileObject(object, canvasContext).node);

    return {
      ok: true,
      diagnostics,
      scene: {
        name: canvas.name,
        width: size.x,
        height: size.y,
        background: backgroundCommand ? stringArg(backgroundCommand, canvasContext) : "transparent",
        children,
      },
    };
  } catch (error) {
    if (error instanceof CompileFailure) {
      diagnostics.push({ severity: "error", message: error.message, range: error.range });
      return { ok: false, diagnostics };
    }
    throw error;
  }
}

function documentContext(document: DocumentNode, diagnostics: Diagnostic[]): CompileContext {
  const context: CompileContext = {
    variables: new Map(),
    registry: new Map(),
    diagnostics,
    scope: [],
    offset: { x: 0, y: 0 },
  };
  for (const member of document.members) {
    if (member.kind === "let") compileLet(member, context);
  }
  return context;
}

function compileAnimation(document: DocumentNode): AnimationSettings | undefined {
  const declarations = document.members.filter((member) => member.kind === "animation");
  const declaration = declarations[0];
  if (!declaration) return undefined;
  if (declarations[1]) throw new CompileFailure("文件中只能声明一个 animation", declarations[1].range);
  let fps: number | undefined;
  for (const command of declaration.commands) {
    if (command.name !== "fps") throw new CompileFailure(`animation 不支持命令“${command.name}”`, command.range);
    if (fps !== undefined) throw new CompileFailure("animation 中 fps 不能重复", command.range);
    const value = command.arguments[0];
    if (command.arguments.length !== 1 || value?.kind !== "number" || value.unit
      || !Number.isFinite(value.value) || value.value < 1 || value.value > 120) {
      throw new CompileFailure("fps 必须是 1 到 120 之间的无单位数值字面量", command.range);
    }
    fps = value.value;
  }
  if (fps === undefined) throw new CompileFailure("animation 缺少 fps", declaration.range);
  return { fps };
}

export function compileAll(source: string): CompileAllResult {
  const parsed = parse(source);
  if (!parsed.document || parsed.diagnostics.some((item) => item.severity === "error")) return { ok: false, diagnostics: parsed.diagnostics };

  const diagnostics: Diagnostic[] = [];
  try {
    const canvases = parsed.document.members.filter(
      (member): member is ObjectNode => member.kind === "object" && member.objectType === "canvas",
    );
    if (canvases.length === 0) throw new CompileFailure("文件中没有 canvas", parsed.document.range);
    const names = new Set<string>();
    for (const canvas of canvases) {
      if (names.has(canvas.name)) throw new CompileFailure(`画布名称“${canvas.name}”重复`, canvas.range);
      names.add(canvas.name);
    }
    const animation = compileAnimation(parsed.document);
    const context = documentContext(parsed.document, diagnostics);
    const scenes: Scene[] = [];
    for (const canvas of canvases) {
      const result = compileCanvas(canvas, context);
      if (!result.ok) return { ok: false, diagnostics: result.diagnostics };
      scenes.push(result.scene);
    }
    return { ok: true, scenes, ...(animation ? { animation } : {}), diagnostics };
  } catch (error) {
    if (error instanceof CompileFailure) {
      diagnostics.push({ severity: "error", message: error.message, range: error.range });
      return { ok: false, diagnostics };
    }
    throw error;
  }
}

export function compile(source: string, options: { canvas?: string } = {}): CompileResult {
  const parsed = parse(source);
  if (!parsed.document || parsed.diagnostics.some((item) => item.severity === "error")) return { ok: false, diagnostics: parsed.diagnostics };
  const canvases = parsed.document.members.filter(
    (member): member is ObjectNode => member.kind === "object" && member.objectType === "canvas",
  );
  const canvas = options.canvas ? canvases.find((candidate) => candidate.name === options.canvas) : canvases[0];
  if (!canvas) return { ok: false, diagnostics: [{ severity: "error", message: options.canvas ? `找不到画布“${options.canvas}”` : "文件中没有 canvas", range: parsed.document.range }] };
  const diagnostics: Diagnostic[] = [];
  try {
    compileAnimation(parsed.document);
    return compileCanvas(canvas, documentContext(parsed.document, diagnostics));
  } catch (error) {
    if (error instanceof CompileFailure) {
      diagnostics.push({ severity: "error", message: error.message, range: error.range });
      return { ok: false, diagnostics };
    }
    throw error;
  }
}
