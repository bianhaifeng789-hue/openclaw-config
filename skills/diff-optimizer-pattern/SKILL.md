# Diff Optimizer Pattern Skill

Diff Optimizer Pattern - optimize single pass + merge cursorMove + remove no-op (0,0) + concat styleStr + dedupe hyperlinks + cancel hide/show pairs + result array + len counter。

## 功能概述

从Claude Code的ink/optimizer.ts提取的Diff优化模式，用于OpenClaw的终端渲染优化。

## 核心机制

### optimize Function

```typescript
export function optimize(diff: Diff): Diff {
  if (diff.length <= 1) {
    return diff  // Single patch: no optimization needed
  }

  const result: Diff = []
  let len = 0  // Track result length for merge checks

  for (const patch of diff) {
    // Apply all rules in single pass
  }
  return result
}
// Single-pass optimization
// All rules applied together
// result array + len counter
```

### Skip No-Ops

```typescript
// Skip no-ops
if (type === 'stdout') {
  if (patch.content === '') continue  // Empty stdout
} else if (type === 'cursorMove') {
  if (patch.x === 0 && patch.y === 0) continue  // No-op move
} else if (type === 'clear') {
  if (patch.count === 0) continue  // Clear 0 lines
}
// Skip empty content
// Skip (0,0) cursorMove
# Skip clear count=0
```

### Merge cursorMove

```typescript
// Merge consecutive cursorMove
if (type === 'cursorMove' && lastType === 'cursorMove') {
  result[lastIdx] = {
    type: 'cursorMove',
    x: last.x + patch.x,
    y: last.y + patch.y,
  }
  continue
}
// Sum x and y coordinates
// Single cursorMove instead of multiple
# Reduce patches count
```

### Collapse cursorTo

```typescript
// Collapse consecutive cursorTo (only the last one matters)
if (type === 'cursorTo' && lastType === 'cursorTo') {
  result[lastIdx] = patch  // Replace with last
  continue
}
// Only last cursorTo matters
// Replace previous
# Sequential cursorTo collapse
```

### Concat styleStr

```typescript
// Concat adjacent style patches. styleStr is a transition diff
// (computed by diffAnsiCodes(from, to)), not a setter
if (type === 'styleStr' && lastType === 'styleStr') {
  result[lastIdx] = { type: 'styleStr', str: last.str + patch.str }
  continue
}
// Concat style strings
// Transition diffs concatenated
# BCE (Background Color Erase) handled
```

### Dedupe hyperlinks

```typescript
// Dedupe hyperlinks
if (
  type === 'hyperlink' &&
  lastType === 'hyperlink' &&
  patch.uri === last.uri
) {
  continue  // Same URI: skip duplicate
}
// Same hyperlink URI: skip
# OSC8 hyperlink dedupe
```

### Cancel hide/show pairs

```typescript
// Cancel cursor hide/show pairs
if (
  (type === 'cursorShow' && lastType === 'cursorHide') ||
  (type === 'cursorHide' && lastType === 'cursorShow')
) {
  result.pop()
  len--
  continue
}
// Hide+Show pair cancels
// Remove both patches
# Cursor visibility cancel
```

### len Counter

```typescript
const result: Diff = []
let len = 0

// After push:
result.push(patch)
len++

// After cancel:
result.pop()
len--
// Manual length tracking
// Faster than result.length
# Merge logic uses len
```

## 实现建议

### OpenClaw适配

1. **diffOptimizer**: optimize function
2. **mergeCursorMove**: cursorMove merge pattern
3. **collapseCursorTo**: cursorTo collapse pattern
4. **concatStyleStr**: styleStr concat pattern
5. **cancelHideShow**: hide/show cancel pattern

### 状态文件示例

```json
{
  "originalPatches": 50,
  "optimizedPatches": 30,
  "mergedCursorMove": 5,
  "dedupedHyperlinks": 3
}
```

## 关键模式

### Single-Pass All Rules

```
for (patch of diff) → apply all rules → single iteration → O(n)
// 一次遍历应用所有规则
// O(n)复杂度
// 无nested loops
```

### Merge vs Collapse

```
cursorMove: merge (sum x+y) | cursorTo: collapse (replace)
// cursorMove合并（累加坐标）
// cursorTo替换（只保留last）
# 不同类型处理方式不同
```

### Transition Diff Concat

```
styleStr: transition diff → concat → BCE handled → can't drop first
// styleStr是transition diff
// 不能drop第一个
# BCE（Background Color Erase）问题
```

### len Manual Counter

```
let len = 0 → len++ / len-- → faster than result.length
// 手动len计数
// 比result.length快
# merge逻辑需要len
```

## 借用价值

- ⭐⭐⭐⭐⭐ Single-pass all rules optimization
- ⭐⭐⭐⭐⭐ Merge/collapse/dedupe/cancel patterns
- ⭐⭐⭐⭐⭐ len manual counter pattern
- ⭐⭐⭐⭐ Transition diff handling (BCE)
- ⭐⭐⭐⭐ No-op removal patterns

## 来源

- Claude Code: `ink/optimizer.ts` (93 lines)
- 分析报告: P49-1