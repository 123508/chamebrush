# Chamebrush 0.1 语言指南

> 当前版本：0.1
>
> 文件扩展名：`.chame`
>
> 这是当前实现的完整说明。0.1 阶段的语法和 API 仍可能调整。

Chamebrush 用文字描述一张二维图。你创建画布，在画布中放入矩形、圆、文字或路径，再为它们设置位置、大小和颜色。编译器会把这些描述转换成 SVG、 PNG 或 WebP。

## 快速入门

下面是一份完整程序：

```chame
let accent "#168a89"

canvas main {
  size (640, 360)
  background "white"

  rect card {
    at (210, 120)
    size (220, 120)
    fill "#40ff00"
    stroke accent 2
    round 16
  }

  text label {
    content "Chamebrush"
    at card.center
    color "#173b3a"
    font-size 24
    font-weight 700
    align center
    vertical-align middle
  }
}
```

它做了四件事：

1. `let accent ...` 定义一个以后会重复使用的颜色；
2. `canvas main` 创建名为 `main` 的画布；
3. `rect card` 绘制一张矩形卡片；
4. `text label` 把文字放在 `card.center`，也就是卡片中心。

每个对象都使用同一种写法：

```chame
对象类型 对象名称 {
  命令 参数
  命令 参数
}
```

对象名称由你决定。之后可以通过这个名称引用对象，例如 `card.center`。

一份文件必须至少有一个 `canvas`。对象按照出现顺序绘制，所以写在后面的对象会盖在前面的对象上。

## 画布和坐标

### 创建画布

画布必须有名称和尺寸：

```chame
canvas poster {
  size (800, 600)
  background "#f5f5f5"
}
```

`size (800, 600)` 表示宽 800、高 600。`background` 可以省略；省略时背景透明。

一份文件可以有多张画布，但名称不能重复：

```chame
canvas front { size (800, 600) }
canvas back { size (800, 600) }
```

### 坐标方向

画布左上角是 `(0, 0)`：

- x 越大，位置越靠右；
- y 越大，位置越靠下；
- `(120, 80)` 表示从左边 120、从上边 80 的位置。

`at` 通常表示对象左上角，`center` 表示中心，`from` 和 `to` 表示线的两个端点。

默认 SVG 输出中，一个坐标单位对应一个屏幕像素。你可以写 `20px` 来表达意图，但当前版本会把 `20px` 和 `20` 当作相同数值。

## 值和变量

### 可以写哪些值

| 值 | 示例 | 常见用途 |
| --- | --- | --- |
| 数字 | `12`、`12.5`、`12px`、`30deg` | 坐标、尺寸、角度、线宽 |
| 百分比 | `50%` | 透明度、连接器标签位置、自定义锚点 |
| 字符串 | `"hello"`、`"#ffffff"` | 文字、颜色、图片路径 |
| 布尔值 | `true`、`false` | 是否显示对象 |
| 二维值 | `(10, 20)` | 坐标、尺寸、偏移、二维缩放 |
| 列表 | `[(0, 0), (20, 30)]` | 折线和多边形的点集 |

颜色名和选项通常可以不加引号：

```chame
fill white
line-cap round
visible true
```

包含 `#`、空格、斜杠或冒号的内容必须使用双引号：

```chame
fill "#ffffff"
font "Noto Sans SC"
source "./images/logo.svg"
```

### 使用变量

变量使用 `let` 声明：

```chame
let unit 8
let accent "#6366f1"
let cardSize (20 * unit, 12 * unit)
```

变量声明后直接写名称即可使用：

```chame
rect card {
  at (40, 40)
  size cardSize
  fill accent
}
```

顶层变量可用于所有画布，画布中的变量可用于该画布。为了让代码容易理解，建议把共享变量放在文件顶层或对应 `canvas` 的开头。

当前版本还有一个需要留意的行为：对象中的变量会继续对后面编译的兄弟对象可见，而且不能用同名局部变量覆盖外层变量。为了让代码容易理解，不要依赖这种“向后泄漏”来组织代码。

### 表达式

普通数字支持 `+`、`-`、`*`、`/`：

```chame
let width 20 * 8
let nextX 100 + width + 24
```

先乘除，后加减；需要时可以加括号。除数不能为零。

两个二维值可以相加或相减：

```chame
let start (100, 80)
let shifted start + (24, 0)
```

百分比、字符串、布尔值和列表不能参加算术运算。

## 最常用的图形

### 矩形

```chame
rect card {
  at (40, 40)
  size (240, 140)
  fill "white"
  stroke "#94a3b8" 2
  round 12
}
```

矩形必须有 `at` 和 `size`。`round` 是圆角半径，默认是 `0`；填充默认是 `none`。

### 圆和椭圆

```chame
circle dot {
  center (120, 100)
  radius 32
  fill "#76e4c0"
}

ellipse shadowShape {
  center (320, 100)
  radius-x 80
  radius-y 36
  fill "#dbeafe"
}
```

半径不能为负数。

### 点和线

```chame
point marker {
  at (80, 80)
  radius 4
  fill red
}

line guide {
  from (80, 80)
  to (320, 80)
  color "#334155"
  width 3
  line-cap round
}
```

点的 `radius` 默认是 `0`，填充默认是 `black`。线的颜色默认是 `black`，宽度默认是 `1`。

### 折线、多边形和三角形

```chame
polygon shape {
  points [
    (20, 20)
    (180, 40)
    (120, 160)
  ]
  fill "#76e4c0"
  stroke "#173b3a" 2
}
```

- `polyline` 至少需要 2 个点，不会自动闭合；
- `polygon` 至少需要 3 个点，会自动闭合；
- `triangle` 必须正好有 3 个点，会自动闭合。

列表中的点可以用逗号分隔，也可以每行写一个。三种对象默认都不填充，也没有描边。

## 颜色、描边和效果

矩形、圆、椭圆、点、折线、多边形、三角形和路径可以使用：

```chame
fill "#ffffff"
stroke "#334155" 2
line-cap round
line-join bevel
```

- `fill none` 表示不填充；
- `stroke` 的第二个参数是线宽，省略时为 `1`；
- `stroke none` 表示不要描边；
- `line-cap` 可选 `butt`、`round`、`square`；
- `line-join` 可选 `miter`、`round`、`bevel`。

所有图形对象，包括文字、图片、连接器和分组，都可以使用下面这些命令：

```chame
opacity 0.8
visible true
shadow (0, 8) 16 "#00000033"
```

`opacity` 必须在 `0` 到 `1` 之间，也可以写成 `80%`。`shadow` 的三个参数依次是偏移、模糊半径和颜色；模糊半径不能为负数。`visible false` 会让整个对象不参与渲染。

## 移动、旋转和缩放

所有图形对象都支持变换：

```chame
rect card {
  at (100, 80)
  size (200, 120)
  origin center
  translate (20, 0)
  rotate 15deg
  scale (1.2, 0.8)
}
```

- `translate (x, y)` 平移对象；
- `rotate angle` 旋转对象，建议用 `deg` 表示角度；
- `scale 1.5` 等比缩放；
- `scale (1.5, 0.8)` 分别缩放 x 和 y；
- `origin` 设置后续旋转和缩放的中心，默认是对象中心。

这些命令可以重复，并按照出现顺序应用。`origin` 只影响它后面的 `rotate` 和 `scale`。

`origin` 可以使用 `center`、`top-left` 等内置锚点，也可以直接写坐标。

## 锚点和连接器

### 内置锚点

每个对象都自动提供以下位置：

```text
left          right
top           bottom
center
top-left      top-right
bottom-left   bottom-right
```

例如：

```chame
text label {
  content "居中的文字"
  at card.center
}
```

追加 `.x` 或 `.y` 可以只取一个坐标：

```chame
let nextX card.right.x + 24
```

对象必须已经出现并完成编译才能被引用，所以不能引用写在后面的对象。

### 自定义锚点

使用 `anchor` 在对象上增加自己的连接位置：

```chame
rect node {
  at (100, 80)
  size (200, 100)
  anchor "input" (0%, 50%)
  anchor "output" (100%, 50%)
}
```

这里的百分比相对于对象边界计算：`(0%, 50%)` 是左边中点，`(100%, 50%)` 是右边中点。普通数字则表示从对象左上角开始的偏移。

### 连接两个对象

```chame
connect request {
  from client.right
  to server.left
  route orthogonal
  arrow end
  color "#6366f1"
  width 2
  label "HTTP"
  label-position 50%
  label-offset (0, -14)
}
```

`route` 可以是：

- `straight`：直线，也是默认值；
- `orthogonal`：水平、垂直、水平的折线路径；
- `curved`：三次贝塞尔曲线；
- `auto`：当前与 `orthogonal` 相同，尚不会自动避开障碍物。

`arrow` 可以是 `none`、`start`、`end` 或 `both`。标签默认放在起点和终点的中间；`label-position` 接受 `0` 到 `1`，也可以写成百分比。

连接器标签按起点和终点之间的直线定位，不会沿弯曲或正交路径测量。解析器目前接受连接器的 `line-cap`，但 SVG 输出尚未应用它，不建议使用。

## 路径、文字、图片和分组

### 路径

```chame
path wave {
  move (20, 100)
  curve (80, 20) (140, 180) (200, 100)
  stroke "#168a89" 6
  line-cap round
}
```

路径的第一个几何命令必须是 `move`。

| 命令 | 参数 | 说明 |
| --- | --- | --- |
| `move` | 终点 | 移动画笔，不画线 |
| `line` | 终点 | 画直线 |
| `quad` | 控制点、终点 | 画二次贝塞尔曲线 |
| `curve` | 控制点 1、控制点 2、终点 | 画三次贝塞尔曲线 |
| `close` | 无 | 闭合当前路径 |

`move`、`line`、`quad` 和 `curve` 可以重复；`close` 当前最多出现一次。路径默认不填充，也没有描边。

### 文字

```chame
text title {
  content "一段可以换行的文字"
  at (320, 80)
  color "#0f172a"
  font "Noto Sans SC"
  font-size 28
  font-weight 700
  align center
  vertical-align top
  max-width 240
  wrap character
  line-height 1.4
}
```

文字必须设置 `content` 和 `at`。其他选项：

| 命令 | 默认值 | 可选值或要求 |
| --- | --- | --- |
| `color` | `black` | 颜色字符串 |
| `font` | `sans-serif` | 字体族字符串 |
| `font-size` | `16` | 不能为负 |
| `font-weight` | `400` | 数字 |
| `align` | `left` | `left`、`center`、`right` |
| `vertical-align` | `baseline` | `top`、`middle`、`bottom`、`baseline` |
| `line-height` | `1.2` | 必须大于 0，单位相当于 em |
| `max-width` | 无 | 必须大于 0 |
| `wrap` | `none` | `word`、`character`、`none` |

`content` 中可以使用 `\n` 主动换行。`word` 按空白分词，`character` 按字符切分。当前版本使用字符数量估算文字宽度，不会读取真实字体尺寸，因此复杂排版可能与浏览器最终显示略有差异。

### 图片

```chame
image logo {
  source "./images/logo.svg"
  at (40, 40)
  size (160, 160)
  fit contain
  round 16
}
```

图片必须设置 `source`、`at` 和 `size`。宽高不能为负数。

`fit` 可以是 `contain`、`cover`、`fill` 或 `none`，默认是 `contain`。`round` 设置裁剪圆角，默认是 `0`。

`source` 可以使用相对路径、绝对路径或 `data:` URL，但不能使用 `https:`、其他非 `data:` 协议 URL，或 `//example.com/...` 这样的协议相对地址。CLI 会相对于 `.chame` 文件所在目录解析相对路径；浏览器中的路径仍受页面来源和浏览器安全策略限制。

### 分组

```chame
group toolbar {
  at (40, 30)

  rect button {
    at (0, 0)
    size (120, 44)
    fill "#168a89"
  }

  text label {
    content "保存"
    at button.center
    align center
    vertical-align middle
  }
}
```

`group at` 会给所有子对象增加相同的位置偏移，默认是 `(0, 0)`。分组也可以整体使用透明度、可见性、阴影和变换。

只有 `group` 会把嵌套对象编译为子图形。不要把一个对象写进矩形、圆或其他非分组对象中。

组内对象的完整名称用点连接，例如 `toolbar.button.center`。在组内通常可以使用较短的相对名称，例如 `button.center`。

## 多画布和逐帧播放

多张画布默认在 Playground 中通过按钮切换。加入 `animation` 后，可以按顺序循环播放：

```chame
animation {
  fps 12
}

canvas frame1 { size (320, 200) }
canvas frame2 { size (320, 200) }
```

一张画布就是一帧。`fps` 必须是 `1` 到 `120` 之间的无单位数字，可以是小数，例如 `23.976`。这里不能使用变量或表达式。

一份文件最多只能有一个 `animation` 块。只有一张画布时仍然静态显示。CLI、SVG、PNG 和 WebP 导出不会生成动画文件，而是分别输出静态画布。

编程接口中，`compileAll` 按源码顺序返回全部画布，并在存在播放配置时返回 `animation: { fps }`。`compile` 返回指定名称的画布，没有指定名称时返回第一张。

## 对象速查表

表格中的“点”表示 `(x, y)` 或返回二维坐标的对象引用。“通用”表示该对象还支持透明度、可见性、阴影、锚点和变换。

| 对象 | 必填命令 | 常用可选命令 | 默认值和限制 |
| --- | --- | --- | --- |
| `point` | `at 点` | `radius`、`fill`、`stroke` | 半径 `0`，填充 `black` |
| `line` | `from 点`、`to 点` | `color`、`width`、`line-cap` | 颜色 `black`，宽度 `1` |
| `polyline` | `points 列表` | 填充和描边 | 至少 2 点，默认不填充 |
| `rect` | `at 点`、`size 点` | `round`、填充和描边 | 圆角 `0`，宽高不能为负 |
| `circle` | `center 点`、`radius 数字` | 填充和描边 | 半径不能为负 |
| `ellipse` | `center 点`、`radius-x`、`radius-y` | 填充和描边 | 半径不能为负 |
| `triangle` | `points 列表` | 填充和描边 | 正好 3 点 |
| `polygon` | `points 列表` | 填充和描边 | 至少 3 点 |
| `path` | 首个几何命令为 `move` | `line`、`quad`、`curve`、`close`、填充和描边 | 默认不填充、无描边 |
| `text` | `content 字符串`、`at 点` | 字体、对齐、换行 | 字号 `16`，颜色 `black` |
| `image` | `source 字符串`、`at 点`、`size 点` | `fit`、`round` | `fit contain`，禁止远程 URL |
| `connect` | `from 点`、`to 点` | 路由、箭头、标签 | 直线、无箭头、宽度 `1` |
| `group` | 无 | `at` 和通用命令 | `at (0, 0)` |

除非特别说明，同一个命令在同一对象中不能重复。可以重复的命令只有 `move`、`line`、`quad`、`curve`、`anchor`、`translate`、`rotate`、`scale` 和 `origin`。

## 书写规则

### 名称

变量名、画布名和对象名：

- 必须以 Unicode 字母或 `_` 开头；
- 后面可以使用 Unicode 字母、数字或 `_`；
- 不能包含连字符 `-`；
- 区分大小写。

推荐使用 `camelCase`：

```chame
let cardWidth 200
canvas mainPoster { size (800, 600) }
```

命令名称允许连字符，所以 `font-size`、`line-cap` 是合法命令。

### 换行

语言没有分号。一个 `let` 或一条命令通常占一行：

```chame
fill white
stroke black 2
```

同一条命令的参数不能换行。需要写很多点时，使用多行列表：

```chame
points [
  (10, 10)
  (80, 20)
  (40, 90)
]
```

只有一条命令的块可以写在一行：

```chame
canvas main { size (320, 200) }
```

### 注释

```chame
// 这是单行注释

/*
  这是块注释
*/
```

块注释不能嵌套，也不能代替命令之间的换行。

### 字符串

字符串使用双引号，不能直接跨行。支持：

| 写法 | 含义 |
| --- | --- |
| `\n` | 换行 |
| `\r` | 回车 |
| `\t` | 制表符 |
| `\"` | 双引号 |
| `\\` | 反斜杠 |

### 数字

可以写 `12`、`12.5`、`.5`、`12.`、`12px`、`30deg` 和 `50%`。不支持科学计数法、十六进制、`NaN` 或 `Infinity`。

`deg` 当前只是帮助阅读的单位标记，编译器不会检查它是否只用在旋转中。百分比只允许用于 `opacity`、`label-position` 和自定义锚点坐标。

## 错误和编程接口

编译器会检查对象类型、命令名、参数数量、必填命令、选项值、数字范围、重复名称和无效引用。

错误会带上行列位置。例如：

```text
drawing.chame:8:3: rect“card”缺少命令“size”
```

解析器会尽量从下一行继续，因此一次可能显示多个语法错误。语义检查目前通常在遇到第一个错误后停止。

核心 API：

```ts
compile(source: string, options?: { canvas?: string }): CompileResult
compileAll(source: string): CompileAllResult
```

成功时，`compile` 返回一个 `scene`，`compileAll` 返回 `scenes` 和可选的 `animation`。失败时，两者都返回：

```ts
{
  ok: false,
  diagnostics: Diagnostic[]
}
```

每条诊断包含消息和源码范围：

```ts
interface Diagnostic {
  severity: "error" | "warning";
  message: string;
  range: {
    from: number;
    to: number;
    line: number;
    column: number;
  };
}
```

`line` 和 `column` 从 `1` 开始。`from` 和 `to` 是源文本中的 UTF-16 偏移。

浏览器包另外提供 `renderSvg`、`renderSvgBlob`、`renderPngBlob`、`renderWebpBlob` 和 `renderSourceToBlob`。位图缩放倍率必须大于 `0`。

## 当前限制

当前实现有这些精度限制和行为边界：

- 文字宽度和自动换行使用字符数估算，不读取真实字体度量；
- 路径边界包含贝塞尔控制点，不计算曲线的精确外接框；
- 描边和阴影不会扩大对象的逻辑边界；
- `connect auto` 不会避障，当前等同于 `orthogonal`；
- 连接器标签沿起点到终点的直线定位；
- `image fit none` 在 SVG 后端目前与 `fill` 使用相同的拉伸行为；
- 图片不接受带网络协议的远程 URL；
- CLI、SVG、PNG 和 WebP 输出都是静态画布；
- 浏览器位图输出会受浏览器字体、SVG、图片和 WebP 支持影响。

## 完整示例

```chame
let paper "#f8fafc"
let ink "#0f172a"
let accent "#6366f1"
let cardSize (200, 88)
let gap 80

canvas architecture {
  size (760, 360)
  background paper

  rect client {
    at (80, 120)
    size cardSize
    fill "#ffffff"
    stroke "#cbd5e1" 2
    round 14
    shadow (0, 8) 18 "#0f172a22"
    anchor "output" (100%, 50%)
  }

  text clientLabel {
    content "客户端"
    at client.center
    color ink
    font-size 20
    font-weight 600
    align center
    vertical-align middle
  }

  rect server {
    at (client.right.x + gap, client.top.y)
    size cardSize
    fill "#ffffff"
    stroke accent 2
    round 14
    anchor "input" (0%, 50%)
  }

  text serverLabel {
    content "服务端"
    at server.center
    color ink
    font-size 20
    font-weight 600
    align center
    vertical-align middle
  }

  connect request {
    from client.output
    to server.input
    route orthogonal
    arrow end
    color accent
    width 2
    label "HTTP"
    label-position 50%
    label-offset (0, -14)
  }
}
```

## 形式文法

下面使用 EBNF：`{ X }` 表示重复零次或多次，`[ X ]` 表示可选，`|` 表示选择，终结符写在引号中，`NL` 表示换行。

```ebnf
Document          ::= { NL } { TopLevel { NL } } ;
TopLevel          ::= LetDeclaration | AnimationDeclaration | CanvasDeclaration ;

LetDeclaration    ::= "let" DeclName Expression LineEnd ;
AnimationDeclaration
                  ::= "animation" "{" { NL } AnimationCommands "}" [ NL ] ;
AnimationCommands ::= [ Command { NL Command } { NL } ] ;

CanvasDeclaration ::= "canvas" DeclName ObjectBody ;
ObjectDeclaration ::= ObjectType DeclName ObjectBody ;
ObjectBody        ::= "{" [ NL ] { ObjectMember { NL } } "}" [ NL ] ;
ObjectMember      ::= LetDeclaration | ObjectDeclaration | Command ;

Command           ::= Identifier { Expression } LineEnd ;
LineEnd           ::= NL | lookahead("}") | end-of-file ;

Expression        ::= Additive ;
Additive          ::= Multiplicative { ("+" | "-") Multiplicative } ;
Multiplicative    ::= Unary { ("*" | "/") Unary } ;
Unary             ::= ("+" | "-") Unary | Primary ;
Primary           ::= Number | String | Boolean | Reference
                    | Tuple | List | "(" Expression ")" ;
Boolean           ::= "true" | "false" ;
Reference         ::= Identifier { "." Identifier } ;
Tuple             ::= "(" Expression "," Expression ")" ;
List              ::= "[" { NL } [ Expression
                        { ListSeparator Expression } [ "," ] { NL } ] "]" ;
ListSeparator     ::= "," { NL } | NL { NL } ;

ObjectType        ::= "point" | "line" | "polyline" | "rect" | "circle"
                    | "ellipse" | "triangle" | "polygon" | "path"
                    | "text" | "image" | "connect" | "group" ;
DeclName          ::= IdentifierWithoutHyphen ;
Identifier        ::= IdentifierStart { IdentifierContinue } ;
IdentifierStart   ::= UnicodeLetter | "_" ;
IdentifierContinue
                  ::= UnicodeLetter | UnicodeNumber | "_" | "-" ;
```

解析器在语法层可以识别任意对象头，但合法程序的顶层对象只能是 `canvas`，绘图对象只能使用 `ObjectType` 中列出的类型，嵌套对象只能放在 `group` 中。
