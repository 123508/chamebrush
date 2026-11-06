# @chamebrush/cli

将 `.chame` 文件导出为 SVG、PNG 或 WebP 的 Chamebrush 命令行工具。

```bash
npm install --global @chamebrush/cli
chame render drawing.chame -o drawing.svg
chame render drawing.chame -o drawing.png --scale 2
chame render drawing.chame -o drawing.svg --json
```

`--json` 会把成功结果或带源码位置的诊断写成单行 JSON，便于 AI Agent 和其他程序可靠地调用 CLI。渲染产物仍写入 `-o` 指定的位置。

输出格式由文件扩展名决定。`--canvas` 可选择多画布文档中的指定画布；PNG/WebP 导出由 Sharp 完成。

许可证：MIT
