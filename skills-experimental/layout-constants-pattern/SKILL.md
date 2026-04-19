# Layout Constants Pattern Skill

Layout Constants Pattern - const object pattern + keyof typeof extraction + LayoutEdge/Display/FlexDirection/Align/Justify/Wrap/Position/Overflow/MeasureMode + typed enum + string literal types + CSS-like naming + Yoga adapter interface。

## 功能概述

从Claude Code的ink/layout/node.ts提取的Layout constants模式，用于OpenClaw的布局引擎常量定义。

## 核心机制

### const Object Pattern

```typescript
export const LayoutEdge = {
  All: 'all',
  Horizontal: 'horizontal',
  Vertical: 'vertical',
  Left: 'left',
  Right: 'right',
  Top: 'top',
  Bottom: 'bottom',
  Start: 'start',
  End: 'end',
} as const
// const object with string values
# as const for literal types
```

### keyof typeof Extraction

```typescript
export type LayoutEdge = (typeof LayoutEdge)[keyof typeof LayoutEdge]
// keyof typeof extracts all keys: 'All' | 'Horizontal' | ...
# typeof LayoutEdge[keyof typeof LayoutEdge] extracts values: 'all' | 'horizontal' | ...
# Result: string literal union type
```

### LayoutEdge Enum

```typescript
LayoutEdge: All | Horizontal | Vertical | Left | Right | Top | Bottom | Start | End
// CSS-like edge naming
# All: uniform edge
# Horizontal/Vertical: axis-specific
```

### LayoutDisplay Enum

```typescript
export const LayoutDisplay = {
  Flex: 'flex',
  None: 'none',
} as const
// Display mode
# Flex: visible
# None: hidden
```

### LayoutFlexDirection Enum

```typescript
export const LayoutFlexDirection = {
  Row: 'row',
  RowReverse: 'row-reverse',
  Column: 'column',
  ColumnReverse: 'column-reverse',
} as const
// Flex direction
# CSS flex-direction naming
```

### LayoutAlign Enum

```typescript
export const LayoutAlign = {
  Auto: 'auto',
  Stretch: 'stretch',
  FlexStart: 'flex-start',
  Center: 'center',
  FlexEnd: 'flex-end',
} as const
// Alignment
# CSS align-items naming
```

### LayoutJustify Enum

```typescript
export const LayoutJustify = {
  FlexStart: 'flex-start',
  Center: 'center',
  FlexEnd: 'flex-end',
  SpaceBetween: 'space-between',
  SpaceAround: 'space-around',
  SpaceEvenly: 'space-evenly',
} as const
// Justify content
# CSS justify-content naming
```

### LayoutWrap Enum

```typescript
export const LayoutWrap = {
  NoWrap: 'nowrap',
  Wrap: 'wrap',
  WrapReverse: 'wrap-reverse',
} as const
// Flex wrap
# CSS flex-wrap naming
```

### LayoutPositionType Enum

```typescript
export const LayoutPositionType = {
  Relative: 'relative',
  Absolute: 'absolute',
} as const
// Position type
# CSS position naming
```

### LayoutOverflow Enum

```typescript
export const LayoutOverflow = {
  Visible: 'visible',
  Hidden: 'hidden',
  Scroll: 'scroll',
} as const
// Overflow behavior
# CSS overflow naming
```

### LayoutMeasureMode Enum

```typescript
export const LayoutMeasureMode = {
  Undefined: 'undefined',
  Exactly: 'exactly',
  AtMost: 'at-most',
} as const
// Measure mode for Yoga
# Exactly: exact width
# AtMost: max width
# Undefined: undefined
```

### CSS-like Naming

```typescript
// All naming follows CSS conventions
// Flex-start, flex-end, space-between, etc.
# Familiar to developers
# CSS naming
```

### Yoga Adapter Interface

```typescript
// LayoutNode interface for Yoga engine
// Yoga is Facebook's flexbox layout engine
# Adapter pattern
# Yoga implementation
```

## 实现建议

### OpenClaw适配

1. **layoutConstants**: const object pattern
2. **keyofTypof**: keyof typeof extraction pattern
3. **cssNaming**: CSS-like naming pattern
4. **layoutEnums**: LayoutEdge/Display/FlexDirection/Align/Justify
5. **yogaAdapter**: Yoga adapter interface

### 状态文件示例

```json
{
  "display": "flex",
  "flexDirection": "column",
  "alignItems": "center",
  "justifyContent": "space-between"
}
```

## 关键模式

### const Object + keyof typeof

```
const Obj = {A: 'a', B: 'b'} as const → type T = (typeof Obj)[keyof typeof Obj] → 'a' | 'b'
# const object定义
# as const确保literal types
# keyof typeof提取values
```

### CSS Naming Convention

```
FlexStart, FlexEnd, SpaceBetween → CSS-like → familiar to developers → Yoga compatible
# CSS naming convention
# 开发者熟悉
# Yoga兼容
```

### String Literal Types

```
'flex' | 'none' | 'row' | 'column' → string literal union → TypeScript enforcement
# string literal union type
# TypeScript强制类型
# 防止拼写错误
```

### Yoga Layout Engine Adapter

```
LayoutNode interface → Yoga native methods → calculateLayout, setWidth, setAlign → adapter pattern
# LayoutNode interface
# Yoga native methods
# Adapter pattern
```

## 借用价值

- ⭐⭐⭐⭐⭐ const object + keyof typeof pattern
- ⭐⭐⭐⭐⭐ CSS-like naming convention
- ⭐⭐⭐⭐⭐ String literal type enforcement
- ⭐⭐⭐⭐⭐ Yoga adapter interface pattern
- ⭐⭐⭐⭐ LayoutMeasureMode enum

## 来源

- Claude Code: `ink/layout/node.ts` (152 lines)
- 分析报告: P52-1