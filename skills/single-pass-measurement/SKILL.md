# Single-Pass Measurement Skill

Single-Pass Measurement - measureText single iteration + width + height + indexOf avoid split + noWrap check + Math.ceil visual lines。

## 功能概述

从Claude Code的ink/measure-text.ts提取的单次测量模式，用于OpenClaw的文本测量优化。

## 核心机制

### Single-Pass Measurement

```typescript
// Single-pass measurement: computes both width and height in one
// iteration instead of two (widestLine + countVisualLines).
// Uses indexOf to avoid array allocation from split('\n').
function measureText(text: string, maxWidth: number): Output {
  // One iteration for both width and height
  // indexOf instead of split('\n')
  // No array allocation
}
// Width + Height in single pass
// Avoid two iterations
// indexOf optimization
```

### Output Type

```typescript
type Output = {
  width: number
  height: number
}
// Both dimensions computed together
// Single return type
```

### noWrap Check

```typescript
// Infinite or non-positive width means no wrapping — each line is one visual line.
// Must check before loop since Math.ceil(w / Infinity) = 0.
const noWrap = maxWidth <= 0 || !Number.isFinite(maxWidth)
// Check before loop
// Math.ceil(w / Infinity) = 0 issue
// noWrap flag
```

### indexOf Pattern

```typescript
while (start <= text.length) {
  const end = text.indexOf('\n', start)
  const line = end === -1 ? text.substring(start) : text.substring(start, end)
  // indexOf to find newline
  // substring for line extraction
  // No split('\n') allocation
}
// indexOf查找newline
// substring提取line
// 避免split分配array
```

### Visual Line Count

```typescript
const w = lineWidth(line)
width = Math.max(width, w)

if (noWrap) {
  height++  // One visual line per line
} else {
  height += w === 0 ? 1 : Math.ceil(w / maxWidth)  // Wrapped visual lines
}
// noWrap: one line per line
// wrapped: Math.ceil(w / maxWidth) visual lines
// Empty line: height += 1
```

### Empty Text Handling

```typescript
if (text.length === 0) {
  return { width: 0, height: 0 }
}
// Early return for empty text
```

## 实现建议

### OpenClaw适配

1. **singlePassMeasure**: Single-pass measurement
2. **indexOfOptimization**: indexOf avoid split
3. **noWrapCheck**: noWrap check before loop
4. **visualLineCount**: Math.ceil(w / maxWidth)
5. **outputType**: width + height together

### 状态文件示例

```json
{
  "width": 120,
  "height": 5,
  "maxWidth": 80,
  "noWrap": false
}
```

## 关键模式

### Single Iteration Optimization

```
width + height → single iteration → avoid two passes → split('\n') twice avoided
// 一次iteration计算两个值
// 避免两次遍历
// 避免两次split分配
```

### indexOf vs split

```
indexOf('\n') + substring → no array allocation → split('\n') avoided
// indexOf查找+substring提取
// 不分配array
// split('\n')开销避免
```

### Math.ceil(Infinity) Issue

```
Math.ceil(w / Infinity) = 0 → check before loop → noWrap flag
// Math.ceil(w / Infinity)结果是0
// 必须在loop前检查
// noWrap flag提前设置
```

### Visual Lines Calculation

```
noWrap: height++ | wrapped: Math.ceil(w / maxWidth) → correct visual line count
// noWrap每line一个visual line
// wrapped按maxWidth计算visual lines
// 空line: height += 1
```

## 借用价值

- ⭐⭐⭐⭐⭐ Single-pass width + height
- ⭐⭐⭐⭐⭐ indexOf avoid split allocation
- ⭐⭐⭐⭐⭐ Math.ceil(Infinity) issue handling
- ⭐⭐⭐⭐ Visual line count pattern
- ⭐⭐⭐⭐ noWrap check before loop

## 来源

- Claude Code: `ink/measure-text.ts` (47 lines)
- 分析报告: P48-2