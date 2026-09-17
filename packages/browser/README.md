# @chamebrush/browser

Chamebrush 的浏览器 API，提供源码编译、SVG 渲染以及 PNG/WebP Blob 导出。

```bash
npm install @chamebrush/browser
```

```ts
import { compile, renderPngBlob, renderSvg } from "@chamebrush/browser";

const result = compile(source);
if (result.ok) {
  const svg = renderSvg(result.scene);
  const png = await renderPngBlob(result.scene, 2);
}
```

PNG 和 WebP 导出需要浏览器提供 Canvas 2D API。

许可证：MIT
