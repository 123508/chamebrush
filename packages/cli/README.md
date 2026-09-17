# @chamebrush/cli

将 `.chame` 文件导出为 SVG、PNG 或 WebP 的 Chamebrush 命令行工具。

```bash
npm install --global @chamebrush/cli
chame render drawing.chame -o drawing.svg
chame render drawing.chame -o drawing.png --scale 2
```

输出格式由文件扩展名决定。`--canvas` 可选择多画布文档中的指定画布；PNG/WebP 导出由 Sharp 完成。

许可证：MIT
