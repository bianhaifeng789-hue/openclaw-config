# layoutShifted Detection Skill

layoutShifted Detection - layoutShifted global flag + yoga position/size diff + child removed detection + resetLayoutShifted + didLayoutShift query + full-damage sledgehammer decision + O(changed cells) diff path。

## 功能概述

从Claude Code的ink/render-node-to-output.ts提取的layoutShift检测模式，用于OpenClaw的渲染优化决策。

## 核心机制

### layoutShifted Global Flag

```typescript
// Per-frame scratch: set when any node's yoga position/size differs from
// its cached value, or a child was removed. Read by ink.tsx to decide
// whether the full-damage sledgehammer (PR #20120) is needed this frame.
let layoutShifted = false
// Global scratch flag
// Set when yoga diff or child removed
# Full-damage decision
```

### yoga Position/Size Diff

```typescript
// Set when any node's yoga position/size differs from its cached value
// Yoga layout engine computes position/size
// Compare with cached value
// Diff → layoutShifted = true
// Yoga computed vs cached
# Position or size change
```

### Child Removed Detection

```typescript
// Or a child was removed
// Child removal triggers layout shift
// Parent needs re-render
// layoutShifted = true
// Child removal
# Layout shift detection
```

### resetLayoutShifted

```typescript
export function resetLayoutShifted(): void {
  layoutShifted = false
}
// Reset at frame start
// Clear flag for new frame
```

### didLayoutShift Query

```typescript
export function didLayoutShift(): boolean {
  return layoutShifted
}
// Query after render
// Decide damage path
# Full-damage or narrow-damage
```

### Full-Damage Sledgehammer

```typescript
// Read by ink.tsx to decide whether the full-damage sledgehammer
// (PR #20120) is needed this frame
// layoutShifted = true → full-damage
// Rewrite whole viewport
// layoutShifted = false → narrow-damage
// O(changed cells) diff
// Full-damage: whole viewport
// Narrow-damage: changed cells only
# Optimization decision
```

### O(changed cells) vs O(rows×cols)

```typescript
// Steady-state frames (spinner tick, clock tick, text append into
// a fixed-height box) don't shift layout → narrow damage bounds →
// O(changed cells) diff instead of O(rows×cols)
// Steady-state: no layout shift
// Narrow damage bounds
# O(changed cells) efficiency
```

### Applies Both Screens

```typescript
// Applies on both alt-screen and main-screen
// layoutShifted detection works both modes
// Alt-screen and main-screen
```

## 实现建议

### OpenClaw适配

1. **layoutShiftedFlag**: layoutShifted global flag
2. **yogaDiffCheck**: yoga position/size diff check
3. **childRemoved**: child removed detection
4. **resetLayoutShifted**: reset function
5. **didLayoutShift**: query function

### 状态文件示例

```json
{
  "layoutShifted": false,
  "yogaNodesChecked": 25,
  "childrenRemoved": 0
}
```

## 关键模式

### Global Scratch Flag

```
let layoutShifted = false → per-frame scratch → reset each frame → query for decision
# 全局scratch flag
# 每帧reset
# 用于决策
```

### Yoga Diff Detection

```
yogaNode.getComputedTop/Left/Width/Height ≠ cached → layoutShifted = true
# Yoga computed值与cached比较
# 不匹配则layoutShifted
```

### Child Removed Trigger

```
child removed → parent layout shift → layoutShifted = true
# 子节点移除
# 父节点layout shift
# 触发full-damage
```

### Full vs Narrow Damage

```
layoutShifted: true → full-damage (O(rows×cols)) | false → narrow-damage (O(changed cells))
# layoutShifted决定damage path
# full-damage: 全viewport
# narrow-damage: 只changed cells
```

### Steady-State Optimization

```
spinner tick, clock tick, fixed-height text append → no shift → O(changed cells)
# steady-state frames无layout shift
# 使用narrow damage
# O(changed cells)高效
```

## 借用价值

- ⭐⭐⭐⭐⭐ layoutShifted detection pattern
- ⭐⭐⭐⭐⭐ Full vs narrow damage decision
- ⭐⭐⭐⭐⭐ Yoga diff check pattern
- ⭐⭐⭐⭐⭐ O(changed cells) vs O(rows×cols) optimization
- ⭐⭐⭐⭐ Steady-state detection pattern

## 来源

- Claude Code: `ink/render-node-to-output.ts` (1462 lines)
- 分析报告: P49-4