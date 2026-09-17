# @chamebrush/core

Chamebrush 的语义编译器和与渲染器无关的场景模型。输入 `.chame` 源码，输出经过校验的场景树或带源码位置的诊断。

```bash
npm install @chamebrush/core
```

```ts
import { compile, compileAll } from "@chamebrush/core";

const one = compile(source, { canvas: "main" });
const document = compileAll(source);
```

许可证：MIT
