# widestLine indexOf Pattern Skill

widestLine indexOf Pattern - indexOf newline + substring extraction + lineWidth cache + Math.max maxWidth + while loop + start <= length + break on -1 + simple function + no split allocation。

## 功能概述

从Claude Code的ink/widest-line.ts提取的widestLine模式，用于OpenClaw的字符串宽度计算优化。

## 核心机制

### widestLine Function

```typescript
export function widestLine(string: string): number {
  let maxWidth = 0
  let start = 0

  while (start <= string.length) {
    const end = string.indexOf('\n', start)
    const line = end === -1 ? string.substring(start) : string.substring(start, end)

    maxWidth = Math.max(maxWidth, lineWidth(line))

    if (end === -1) break
    start = end + 1
  }

  return maxWidth
}
// Find widest line in multi-line string
# indexOf + substring pattern
```

### indexOf Newline

```typescript
const end = string.indexOf('\n', start)
// indexOf查找newline
// No split('\n') allocation
# Efficient line extraction
```

### substring Extraction

```typescript
const line = end === -1 ? string.substring(start) : string.substring(start, end)
// end === -1: last line (no newline)
# substring(start, end): line between newlines
```

### lineWidth Cache

```typescript
import { lineWidth } from './line-width-cache.js'
maxWidth = Math.max(maxWidth, lineWidth(line))
// lineWidth from cache
# Cached width calculation
```

### Math.max maxWidth

```typescript
maxWidth = Math.max(maxWidth, lineWidth(line))
// Track maximum width
# Across all lines
```

### while Loop Pattern

```typescript
while (start <= string.length) {
  // ... process line
  start = end + 1
}
// Iterate all lines
# start index tracking
```

### start <= length

```typescript
while (start <= string.length)
// Process all lines including last
# Inclusive length check
```

### break on -1

```typescript
if (end === -1) break  // No more newlines
// Last line processed
# Exit loop
```

### Simple Function

```typescript
// 19 lines total
// No complex logic
# Simple indexOf + substring pattern
```

### No split Allocation

```typescript
// Uses indexOf + substring instead of split('\n')
// Avoids array allocation
# Memory efficient
```

## 实现建议

### OpenClaw适配

1. **widestLineFunction**: widestLine function
2. **indexOfPattern**: indexOf newline pattern
3. **substringExtraction**: substring extraction pattern
4. **lineWidthCache**: lineWidth cache usage
5. **noSplitAllocation**: No split allocation pattern

### 状态文件示例

```json
{
  "maxWidth": 120,
  "lineCount": 10,
  "lastLineStart": 500
}
```

## 关键模式

### indexOf vs split

```
indexOf('\n') + substring → no array allocation → split('\n') avoided → memory efficient
# indexOf + substring提取line
# 避免split('\n')分配array
# Memory efficient
```

### lineWidth Cache Integration

```
lineWidth(line) → cached calculation → no repeated computation → performance
# lineWidth from cache
# 避免重复计算
# Performance boost
```

### While Loop Iteration

```
while (start <= length) → process all lines → start = end + 1 → inclusive check
# while loop迭代所有lines
# start index tracking
# 包含最后一行
```

### Math.max Maximum Tracking

```
Math.max(maxWidth, lineWidth) → track maximum → across all lines → return widest
# Math.max跟踪最大width
# 所有lines比较
# 返回widest line width
```

## 借用价值

- ⭐⭐⭐⭐⭐ indexOf + substring pattern
- ⭐⭐⭐⭐⭐ No split allocation optimization
- ⭐⭐⭐⭐⭐ lineWidth cache integration
- ⭐⭐⭐⭐⭐ Simple while loop pattern
- ⭐⭐⭐⭐ break on -1 pattern

## 来源

- Claude Code: `ink/widest-line.ts` (19 lines)
- 分析报告: P50-6