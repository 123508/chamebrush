# @chamebrush/language

Chamebrush 绘图语言的手写解析器、源码 AST 和 Lezer 编辑器语法。

```bash
npm install @chamebrush/language
```

```ts
import { chamebrushParser, parse } from "@chamebrush/language";

const result = parse(`canvas demo {
  size (320, 180)
}`);

console.log(result.document, result.diagnostics);
const editorTree = chamebrushParser.parse("canvas demo {");
```

许可证：MIT
