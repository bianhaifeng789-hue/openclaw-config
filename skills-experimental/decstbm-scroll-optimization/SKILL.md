# DECSTBM Scroll Optimization Skill

DECSTBM Scroll Optimization - ScrollHint type + DECSTBM scroll region + hardware scroll (SU/SD) + top/bottom rows + delta direction + scrollTop change detection + CSI n S/CSI n T pattern。

## 功能概述

从Claude Code的ink/render-node-to-output.ts提取的DECSTBM滚动优化模式，用于OpenClaw的终端滚动性能优化。

## 核心机制

### ScrollHint Type

```typescript
// DECSTBM scroll optimization hint. When a ScrollBox's scrollTop changes
// between frames (and nothing else moved), log-update.ts can emit a
// hardware scroll (DECSTBM + SU/SD) instead of rewriting the whole viewport.
export type ScrollHint = {
  top: number      // 0-indexed inclusive screen row
  bottom: number   // 0-indexed inclusive screen row
  delta: number    // >0: content moved up (scrollTop increased, CSI n S)
}
// Hardware scroll optimization
// Only scrollTop changed, nothing else moved
# DECSTBM + SU/SD CSI sequences
```

### DECSTBM Scroll Region

```typescript
// DECSTBM: Set Top and Bottom Margins
// CSI top ; bottom r
// Defines scroll region
// Only rows in region scroll
// Terminal scroll region
// Limits scroll area
# Efficient partial scroll
```

### SU/SD CSI Sequences

```typescript
// CSI n S: Scroll Down (content moves up, scrollTop increased)
// CSI n T: Scroll Up (content moves down, scrollTop decreased)
// Hardware scroll: terminal shifts rows
// No re-render needed
// Hardware scroll sequences
// CSI n S/CSI n T
# Skip full viewport rewrite
```

### scrollTop Change Detection

```typescript
// When a ScrollBox's scrollTop changes between frames
// (and nothing else moved), emit hardware scroll
// scrollTop diff only
// No layout shift
# Hardware scroll eligible
```

### top/bottom Inclusive

```typescript
// top/bottom are 0-indexed inclusive screen rows
// Define scroll region boundaries
// 0-indexed inclusive
// Region rows
```

### delta Direction

```typescript
// delta > 0: content moved up (scrollTop increased)
// CSI n S (scroll down n lines)
// delta < 0: content moved down (scrollTop decreased)
// CSI n T (scroll up n lines)
// Direction from delta
// CSI sequence choice
```

### Reset Pattern

```typescript
export function resetScrollHint(): void {
  scrollHint = null
  absoluteRectsPrev = absoluteRectsCur
  absoluteRectsCur = []
}
// Reset per-frame
// Record absolute rects
# Previous frame rects preserved
```

## 实现建议

### OpenClaw适配

1. **scrollHintType**: ScrollHint type definition
2. **decstbmScroll**: DECSTBM scroll region pattern
3. **csiSuSd**: CSI n S/CSI n T sequences
4. **scrollTopChange**: scrollTop change detection
5. **inclusiveRows**: top/bottom inclusive rows

### 状态文件示例

```json
{
  "scrollHint": {
    "top": 5,
    "bottom": 20,
    "delta": 3
  },
  "scrollTopPrev": 10,
  "scrollTopCur": 13
}
```

## 关键模式

### Hardware Scroll vs Full Rewrite

```
scrollTop change only → DECSTBM + SU/SD → hardware scroll → skip full viewport rewrite
# 只有scrollTop变化
# 使用硬件滚动
# 避免全viewport重写
# 大幅减少IO
```

### Scroll Region Margins

```
DECSTBM: CSI top ; bottom r → scroll region → only region rows shift
# DECSTBM设置滚动区域
# 只有区域内rows滚动
# 其他rows保持
```

### CSI n S vs CSI n T

```
delta > 0: CSI n S (scroll down, content up) | delta < 0: CSI n T (scroll up, content down)
# delta正负决定CSI sequence
# CSI n S: scroll down n lines
# CSI n T: scroll up n lines
```

### scrollTop Diff Only

```
scrollTop change + nothing else moved → hardware scroll eligible
# scrollTop变化是唯一条件
# 无其他layout shift
# 硬件滚动优化eligible
```

## 借用价值

- ⭐⭐⭐⭐⭐ DECSTBM hardware scroll optimization
- ⭐⭐⭐⭐⭐ ScrollHint type pattern
- ⭐⭐⭐⭐⭐ CSI n S/CSI n T sequences
- ⭐⭐⭐⭐⭐ scrollTop change detection
- ⭐⭐⭐⭐ Scroll region margins pattern

## 来源

- Claude Code: `ink/render-node-to-output.ts` (1462 lines)
- 分析报告: P49-3