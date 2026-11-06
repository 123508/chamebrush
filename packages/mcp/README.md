# @chamebrush/mcp

Chamebrush 的 MCP 服务器与交互式 MCP App。服务器提供 `chamebrush_render` 工具，把完整 `.chame` 源码编译为结构化诊断或 SVG 画布；支持 MCP Apps 的宿主会同时显示“预览 / 代码”切换界面。

通过 npm 启动 MCP 服务器。将下面的 stdio 配置加入支持 MCP 的客户端后，请新建会话，让客户端重新发现工具。

```json
{
  "command": "npx",
  "args": ["-y", "@chamebrush/mcp"]
}
```

工具输入：

```json
{
  "source": "canvas main { size (320, 200) }",
  "canvas": "main"
}
```

`canvas` 可以省略；省略时按源码顺序返回所有画布。编译失败时，结果包含消息、行列和 UTF-16 源码范围。
