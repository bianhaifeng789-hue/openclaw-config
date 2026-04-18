# Edges Function Overloads Skill

Edges Function Overloads - edges() function + 4 overload signatures + uniform edges + axis edges + individual edges + function implementation + edges(a,b?,c?,d?) + ZERO_EDGES constant + resolveEdges partial + addEdges addition + Rectangle union + clampRect bounds。

## 功能概述

从Claude Code的ink/layout/geometry.ts提取的Edges function overloads模式，用于OpenClaw的边距处理。

## 核心机制

### edges() Function Overloads

```typescript
export function edges(all: number): Edges  // Uniform edges
export function edges(vertical: number, horizontal: number): Edges  // Axis edges
export function edges(top: number, right: number, bottom: number, left: number): Edges  // Individual
export function edges(a: number, b?: number, c?: number, d?: number): Edges {  // Implementation
  if (b === undefined) {
    return { top: a, right: a, bottom: a, left: a }  // 1 arg: uniform
  }
  if (c === undefined) {
    return { top: a, right: b, bottom: a, left: b }  // 2 args: axis
  }
  return { top: a, right: b, bottom: c, left: d! }  // 4 args: individual
}
// 4 overload signatures
# Implementation handles all cases
```

### Uniform Edges (1 arg)

```typescript
edges(10) → {top: 10, right: 10, bottom: 10, left: 10}
// All edges same value
# Single argument
```

### Axis Edges (2 args)

```typescript
edges(10, 20) → {top: 10, right: 20, bottom: 10, left: 20}
// vertical (top/bottom) = 10, horizontal (right/left) = 20
# Two arguments
```

### Individual Edges (4 args)

```typescript
edges(10, 20, 30, 40) → {top: 10, right: 20, bottom: 30, left: 40}
// Each edge individual value
# Four arguments
```

### Edges Type

```typescript
export type Edges = {
  top: number
  right: number
  bottom: number
  left: number
}
// Edge insets (padding, margin, border)
# CSS-like naming
```

### ZERO_EDGES Constant

```typescript
export const ZERO_EDGES: Edges = { top: 0, right: 0, bottom: 0, left: 0 }
// Zero edges constant
# No padding/margin/border
```

### resolveEdges Partial

```typescript
export function resolveEdges(partial?: Partial<Edges>): Edges {
  return {
    top: partial?.top ?? 0,
    right: partial?.right ?? 0,
    bottom: partial?.bottom ?? 0,
    left: partial?.left ?? 0,
  }
}
// Convert partial edges to full with defaults
# Missing edges → 0
```

### addEdges Addition

```typescript
export function addEdges(a: Edges, b: Edges): Edges {
  return {
    top: a.top + b.top,
    right: a.right + b.right,
    bottom: a.bottom + b.bottom,
    left: a.left + b.left,
  }
}
// Add two edge values
# Sum each edge
```

### Rectangle union

```typescript
export function unionRect(a: Rectangle, b: Rectangle): Rectangle {
  const minX = Math.min(a.x, b.x)
  const minY = Math.min(a.y, b.y)
  const maxX = Math.max(a.x + a.width, b.x + b.width)
  const maxY = Math.max(a.y + a.height, b.y + b.height)
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
// Union two rectangles
# Bounding box
```

### clampRect Bounds

```typescript
export function clampRect(rect: Rectangle, size: Size): Rectangle {
  const minX = Math.max(0, rect.x)
  const minY = Math.max(0, rect.y)
  const maxX = Math.min(size.width - 1, rect.x + rect.width - 1)
  const maxY = Math.min(size.height - 1, rect.y + rect.height - 1)
  return {
    x: minX,
    y: minY,
    width: Math.max(0, maxX - minX + 1),
    height: Math.max(0, maxY - minY + 1),
  }
}
// Clamp rectangle to size bounds
# Ensure non-negative width/height
```

## 实现建议

### OpenClaw适配

1. **edgesOverloads**: edges() function overloads
2. **edgesType**: Edges type definition
3. **zeroEdgesConstant**: ZERO_EDGES constant
4. **resolveEdgesPartial**: resolveEdges partial handling
5. **addEdgesUnion**: addEdges + unionRect pattern

### 状态文件示例

```json
{
  "edges": {"top": 10, "right": 20, "bottom": 10, "left": 20},
  "argsCount": 2
}
```

## 关键模式

### Function Overload Signatures

```
edges(all): Edges | edges(v,h): Edges | edges(t,r,b,l): Edges → 3 signatures → 1 implementation
# 多个overload signatures
# 单一implementation
# TypeScript类型安全
```

### Arguments Count Dispatch

```
b === undefined → uniform | c === undefined → axis | else → individual → argument count pattern
# 根据arguments数量dispatch
# undefined检查
# 不同逻辑
```

### Partial with Default 0

```
Partial<Edges> → resolveEdges → missing ?? 0 → full Edges → partial handling
# Partial<Edges>输入
# resolveEdges处理
# 缺失值默认0
```

### Rectangle Union Bounding Box

```
unionRect(a, b) → minX, minY, maxX, maxY → bounding box → combine rectangles
# unionRect计算bounding box
# 包含两个rectangle的最小外框
```

## 借用价值

- ⭐⭐⭐⭐⭐ Function overload pattern
- ⭐⭐⭐⭐⭐ Arguments count dispatch pattern
- ⭐⭐⭐⭐⭐ ZERO_EDGES constant pattern
- ⭐⭐⭐⭐⭐ resolveEdges partial handling
- ⭐⭐⭐⭐ Rectangle union + clampRect

## 来源

- Claude Code: `ink/layout/geometry.ts` (97 lines)
- 分析报告: P52-2