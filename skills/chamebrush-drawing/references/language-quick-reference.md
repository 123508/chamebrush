# Chamebrush quick reference

Use this bundled, self-contained reference to generate valid Chamebrush 0.1 source for the `@chamebrush/cli` and `@chamebrush/mcp` npm packages. Do not invent syntax that is not listed here.

## Document shape

```chame
let accent "#168a89"

canvas main {
  size (640, 360)
  background "#f6f3e8"

  rect card {
    at (160, 100)
    size (320, 160)
    fill "white"
    stroke accent 2
    round 16
  }

  text label {
    content "Chamebrush"
    at card.center
    color "#173b3a"
    font-size 28
    font-weight 700
    align center
    vertical-align middle
  }
}
```

A file needs at least one named `canvas` with `size (width, height)`. Later objects paint over earlier objects. Names use letters, numbers, and `_`, cannot contain `-`, and are case-sensitive. Commands such as `font-size` may contain `-`.

## Command line boundaries

Chamebrush is line-oriented: a newline ends a command. Put exactly one command on each physical line. There are no semicolons, and multiple commands cannot share a line.

```chame
// Correct
connect request {
  from client.right
  to service.left
  route orthogonal
  arrow end
}

// Incorrect: everything after `from` is parsed as more arguments to `from`
connect request { from client.right to service.left route orthogonal arrow end }
```

A block may stay on one line only when it contains exactly one command:

```chame
canvas main { size (320, 200) }
```

Write multiline source directly. Do not compact commands and later split them with a regex or a list of command names. Tokens such as `center` and `round` can be command arguments, so context-free splitting corrupts valid source such as `align center` and `line-cap round`.

## Values

- Numbers: `12`, `12.5`, `20px`, `30deg`; arithmetic supports `+ - * /`.
- Percentages: allowed for opacity, connector label position, and custom anchor coordinates.
- Points and sizes: `(x, y)`.
- Strings: double-quoted; use quotes for hex colors, spaces, paths, and URLs.
- Lists: `[(10, 10), (40, 30), (20, 80)]`, with commas or newlines.
- Variables: `let gap 24`; declare before use.
- Comments: `// line` or `/* block */`.

## Objects

| Object | Required commands | Common optional commands |
| --- | --- | --- |
| `rect` | `at`, `size` | `fill`, `stroke`, `round` |
| `circle` | `center`, `radius` | `fill`, `stroke` |
| `ellipse` | `center`, `radius-x`, `radius-y` | `fill`, `stroke` |
| `point` | `at` | `radius`, `fill`, `stroke` |
| `line` | `from`, `to` | `color`, `width`, `line-cap` |
| `polyline` | `points` with at least 2 points | `fill`, `stroke` |
| `triangle` | `points` with exactly 3 points | `fill`, `stroke` |
| `polygon` | `points` with at least 3 points | `fill`, `stroke` |
| `text` | `content`, `at` | `color`, `font`, `font-size`, `font-weight`, `align`, `vertical-align`, `max-width`, `wrap`, `line-height` |
| `image` | `source`, `at`, `size` | `fit`, `round` |
| `connect` | `from`, `to` | `route`, `arrow`, `color`, `width`, `label`, `label-position`, `label-offset` |
| `group` | none | `at`; may contain objects |
| `path` | first geometry command must be `move` | `line`, `quad`, `curve`, `close`, `fill`, `stroke` |

Shape commands include `fill`, `stroke <color> [width]`, `line-cap butt|round|square`, and `line-join miter|round|bevel`. All objects support `opacity`, `visible`, `shadow`, `anchor`, `translate`, `rotate`, `scale`, and `origin`.

## Common command signatures

Use these signatures exactly; the items after the command name are parser arguments, not CSS-style fields:

| Command | Signature | Example |
| --- | --- | --- |
| `shadow` | `shadow <offset-point> <blur> <color>` | `shadow (0, 10) 28 "#00000033"` |
| `stroke` | `stroke <color> [width]` | `stroke "#334155" 2` |
| `line-cap` | `line-cap butt\|round\|square` | `line-cap round` |
| `align` | `align left\|center\|right` | `align center` |
| `from` / `to` | one point or anchor reference | `from client.right` |
| `route` | `route straight\|orthogonal\|curved\|auto` | `route orthogonal` |
| `arrow` | `arrow none\|start\|end\|both` | `arrow end` |

The shadow offset is one point argument. Do not write CSS-like four-scalar syntax:

```chame
// Correct: 3 arguments
shadow (0, 10) 28 "#00000033"

// Incorrect: 4 arguments
shadow 0 10 28 "#00000033"
```

## Anchors and connectors

Every compiled object exposes `left`, `right`, `top`, `bottom`, `center`, `top-left`, `top-right`, `bottom-left`, and `bottom-right`. Append `.x` or `.y` for a scalar coordinate. References must target an earlier object.

```chame
rect service {
  at (360, 100)
  size (180, 80)
  anchor "input" (0%, 50%)
}

connect request {
  from client.right
  to service.input
  route orthogonal
  arrow end
  label "HTTP"
}
```

Connector routes are `straight`, `orthogonal`, `curved`, or `auto`. Arrows are `none`, `start`, `end`, or `both`.

## Text, images, and frames

Text alignment values are `left|center|right`; vertical alignment values are `top|middle|bottom|baseline`; wrapping is `word|character|none`.

Image fit values are `contain|cover|fill|none`. Use local paths or `data:` URLs only; network URLs are rejected.

For animation, place one drawing frame in each canvas:

```chame
animation { fps 12 }
canvas frame1 { size (320, 200) }
canvas frame2 { size (320, 200) }
```

`fps` must be a literal number from 1 through 120. Static exports produce one file per canvas.
