# @chamebrush/renderer-svg

将 Chamebrush 场景树渲染为 SVG 字符串的纯 TypeScript 渲染器。

```bash
npm install @chamebrush/core @chamebrush/renderer-svg
```

```ts
import { compile } from "@chamebrush/core";
import { renderSvg } from "@chamebrush/renderer-svg";

const result = compile(source);
if (result.ok) {
  const svg = renderSvg(result.scene);
}
```

许可证：MIT
