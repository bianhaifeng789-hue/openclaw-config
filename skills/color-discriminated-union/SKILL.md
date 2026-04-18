# Color Discriminated Union Skill

Color Discriminated Union - Color type union + type discriminant + named/indexed/rgb/default variants + NamedColor enum + TextStyle type + defaultStyle function + UnderlineStyle enum + comprehensive text attributes。

## 功能概述

从Claude Code的ink/termio/types.ts提取的Color discriminated union模式，用于OpenClaw的ANSI样式类型定义。

## 核心机制

### Color Type Union

```typescript
/** Color specification - can be named, indexed (256), or RGB */
export type Color =
  | { type: 'named'; name: NamedColor }
  | { type: 'indexed'; index: number } // 0-255
  | { type: 'rgb'; r: number; g: number; b: number }
  | { type: 'default' }
// Discriminated union
# type field as discriminant
# named: 16 named colors
# indexed: 256-color palette
# rgb: true color
# default: terminal default
```

### type Discriminant

```typescript
type: 'named' | 'indexed' | 'rgb' | 'default'
// Discriminant field
# Type narrowing
# TypeScript discriminated union
```

### NamedColor Enum

```typescript
export type NamedColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'brightBlack'
  | 'brightRed'
  | 'brightGreen'
  | 'brightYellow'
  | 'brightBlue'
  | 'brightMagenta'
  | 'brightCyan'
  | 'brightWhite'
// 16 named colors
# Standard 8 + bright 8
```

### indexed Variant

```typescript
{ type: 'indexed'; index: number } // 0-255
// 256-color palette
# Index 0-255
```

### rgb Variant

```typescript
{ type: 'rgb'; r: number; g: number; b: number }
// True color (24-bit)
# R, G, B components (0-255)
```

### default Variant

```typescript
{ type: 'default' }
// Terminal default color
# No fields except type
```

### TextStyle Type

```typescript
export type TextStyle = {
  bold: boolean
  dim: boolean
  italic: boolean
  underline: UnderlineStyle
  blink: boolean
  inverse: boolean
  hidden: boolean
  strikethrough: boolean
  overline: boolean
  fg: Color
  bg: Color
  underlineColor: Color
}
// Comprehensive text style
# Boolean attributes
# Color attributes
```

### defaultStyle Function

```typescript
export function defaultStyle(): TextStyle {
  return {
    bold: false,
    dim: false,
    italic: false,
    underline: 'none',
    blink: false,
    inverse: false,
    hidden: false,
    strikethrough: false,
    overline: false,
    fg: { type: 'default' },
    bg: { type: 'default' },
    underlineColor: { type: 'default' },
  }
}
// Default (reset) style factory
# All attributes false/default
```

### UnderlineStyle Enum

```typescript
export type UnderlineStyle =
  | 'none'
  | 'single'
  | 'double'
  | 'curly'
  | 'dotted'
  | 'dashed'
// Underline variants
# SGR 4: single
# SGR 21: double
# Extended underline styles
```

### Boolean Attributes

```typescript
bold: boolean      // SGR 1
dim: boolean       // SGR 2
italic: boolean    // SGR 3
blink: boolean     // SGR 5
inverse: boolean   // SGR 7
hidden: boolean    // SGR 8
strikethrough: boolean  // SGR 9
overline: boolean  // SGR 53
// SGR boolean attributes
# Named by function
```

## 实现建议

### OpenClaw适配

1. **colorUnion**: Color discriminated union
2. **namedColorEnum**: NamedColor enum
3. **textStyleType**: TextStyle type
4. **defaultStyleFactory**: defaultStyle function
5. **underlineStyleEnum**: UnderlineStyle enum

### 状态文件示例

```json
{
  "fg": {"type": "rgb", "r": 255, "g": 0, "b": 0},
  "bg": {"type": "default"},
  "bold": true,
  "underline": "single"
}
```

## 关键模式

### Discriminated Union Pattern

```
type: 'named' | 'indexed' | 'rgb' | 'default' → discriminant → TypeScript narrowing
# type字段作为discriminant
# TypeScript类型收窄
# 不同variant不同fields
```

### NamedColor 16-Color Palette

```
black...white (8) + brightBlack...brightWhite (8) → 16 named colors → standard palette
# 16 named colors
# 标准8色 + bright 8色
```

### indexed vs rgb

```
indexed: 0-255 (256-color) | rgb: r,g,b (24-bit) → different color modes
# indexed: 256色palette
# rgb: true color 24-bit
# 不同color modes
```

### defaultStyle Factory

```
defaultStyle() → all false/default → reset state → SGR 0 equivalent
# defaultStyle工厂函数
# 所有属性false/default
# 等价于SGR 0 reset
```

### UnderlineStyle Extended

```
none/single/double/curly/dotted/dashed → extended underline styles → SGR 4:1:0-5
# 扩展underline styles
# SGR 4:1:0-5表示
# curly/dotted/dashed
```

## 借用价值

- ⭐⭐⭐⭐⭐ Color discriminated union pattern
- ⭐⭐⭐⭐⭐ NamedColor 16-color palette
- ⭐⭐⭐⭐⭐ TextStyle comprehensive attributes
- ⭐⭐⭐⭐⭐ defaultStyle factory pattern
- ⭐⭐⭐⭐⭐ UnderlineStyle extended variants

## 来源

- Claude Code: `ink/termio/types.ts` (236 lines)
- 分析报告: P51-3