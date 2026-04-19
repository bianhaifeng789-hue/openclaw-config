# absoluteRects Tracking Skill

absoluteRects Tracking - absoluteRectsPrev/Cur arrays + position:absolute tracking + ScrollBox blit+shift repair + three recording paths + full-render nodeCache.set + blit early-return + blitEscapingAbsoluteDescendants + clean-overlay consecutive scrolls。

## 功能概述

从Claude Code的ink/render-node-to-output.ts提取的absoluteRects追踪模式，用于OpenClaw的滚动渲染修复。

## 核心机制

### absoluteRectsPrev/Cur Arrays

```typescript
// Rects of position:absolute nodes from the PREVIOUS frame, used by
// ScrollBox's blit+shift third-pass repair (see usage site).
let absoluteRectsPrev: Rectangle[] = []
let absoluteRectsCur: Rectangle[] = []
// Track position:absolute nodes
// Previous and current frame rects
# ScrollBox blit+shift repair
```

### position:absolute Tracking

```typescript
// Rects of position:absolute nodes
// Absolute positioned nodes overlay content
// Scroll needs repair for overlay
// Track rects for repair
```

### ScrollBox blit+shift Repair

```typescript
// Used by ScrollBox's blit+shift third-pass repair
// ScrollBox content scrolls, absolute overlays shift differently
// Third-pass repair corrects overlay
// blit + shift pattern
// ScrollBox scrolling
# Absolute overlay repair
```

### Three Recording Paths

```typescript
// Recorded at three paths — full-render nodeCache.set,
// node-level blit early-return, blitEscapingAbsoluteDescendants
// — so clean-overlay consecutive scrolls still have the rect
// Three recording locations:
// 1. full-render nodeCache.set
// 2. node-level blit early-return
// 3. blitEscapingAbsoluteDescendants
# Clean-overlay support
```

### nodeCache.set Path

```typescript
// full-render nodeCache.set
// Full render records absolute rects
// nodeCache update path
```

### blit Early-Return Path

```typescript
// node-level blit early-return
// Blit optimization records absolute rects
// Early return path
```

### blitEscapingAbsoluteDescendants Path

```typescript
// blitEscapingAbsoluteDescendants
// Absolute descendants escaping scroll
// Special blit path
```

### clean-overlay Consecutive Scrolls

```typescript
// So clean-overlay consecutive scrolls still have the rect
// Consecutive scrolls need previous rect
// clean-overlay pattern
# Rects preserved across frames
```

### resetScrollHint Reset

```typescript
export function resetScrollHint(): void {
  scrollHint = null
  absoluteRectsPrev = absoluteRectsCur  // Swap prev with cur
  absoluteRectsCur = []  // Reset cur for new frame
}
// Swap prev with cur each frame
// Reset cur for new frame
# Previous rects available
```

## 实现建议

### OpenClaw适配

1. **absoluteRects**: absoluteRectsPrev/Cur arrays
2. **absoluteTracking**: position:absolute tracking
3. **threePaths**: Three recording paths
4. **scrollBoxRepair**: ScrollBox blit+shift repair
5. **cleanOverlay**: clean-overlay consecutive scrolls

### 状态文件示例

```json
{
  "absoluteRectsPrev": [{"x": 10, "y": 5, "width": 20, "height": 10}],
  "absoluteRectsCur": [{"x": 10, "y": 15, "width": 20, "height": 10}]
}
```

## 关键模式

### Prev/Cur Swap Pattern

```
absoluteRectsPrev = absoluteRectsCur | absoluteRectsCur = [] → prev available for repair
# 每帧swap prev和cur
# cur reset
# prev可用于repair
```

### Three Recording Paths

```
nodeCache.set + blit early-return + blitEscapingAbsoluteDescendants → cover all cases
# 三个记录路径覆盖所有场景
# full-render
# blit optimization
# escaping descendants
```

### Absolute Overlay Repair

```
ScrollBox blit+shift → absolute overlay needs repair → use absoluteRectsPrev
# ScrollBox滚动时
# absolute overlay需要repair
# 使用prev rects
```

### Clean-Overlay Consecutive

```
consecutive scrolls → previous rect needed → three paths ensure rect available
# 连续滚动需要previous rect
# 三路径确保rect可用
# clean-overlay pattern
```

## 借用价值

- ⭐⭐⭐⭐⭐ absoluteRects tracking pattern
- ⭐⭐⭐⭐⭐ Prev/Cur swap pattern
- ⭐⭐⭐⭐⭐ Three recording paths coverage
- ⭐⭐⭐⭐⭐ ScrollBox blit+shift repair
- ⭐⭐⭐⭐ clean-overlay consecutive scrolls

## 来源

- Claude Code: `ink/render-node-to-output.ts` (1462 lines)
- 分析报告: P49-5