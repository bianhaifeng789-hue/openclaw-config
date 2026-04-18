# scrollDrainNode Pattern Skill

scrollDrainNode Pattern - scrollDrainNode global + pendingScrollDelta drain continuation + markDirty post-render + next frame blit fail + descend to continue draining + dirty flag cleared issue + drain stall prevention。

## 功能概述

从Claude Code的ink/render-node-to-output.ts提取的scrollDrainNode模式，用于OpenClaw的滚动delta持续drain。

## 核心机制

### scrollDrainNode Global

```typescript
// The ScrollBox DOM node (if any) with pendingScrollDelta left after this
// frame's drain. renderer.ts calls markDirty(it) post-render so the NEXT
// frame's root blit check fails and we descend to continue draining.
let scrollDrainNode: DOMElement | null = null
// Global reference to ScrollBox with pending delta
# Post-render markDirty for next frame
```

### pendingScrollDelta Drain Continuation

```typescript
// pendingScrollDelta left after this frame's drain
// SCROLL_MAX_PER_FRAME limits drain per frame
// Remaining delta needs next frame drain
// Frame-rate limited drain
# Continuation across frames
```

### markDirty Post-Render

```typescript
// renderer.ts calls markDirty(it) post-render so the NEXT frame's
// root blit check fails and we descend to continue draining
// Post-render mark dirty
// Next frame will descend to this node
# Ensures continuation
```

### Next Frame blit Fail

```typescript
// NEXT frame's root blit check fails
// Blit optimization: if dirty=false, skip descent
// markDirty → dirty=true → blit fails → descend
// Blit optimization bypass
# Force descent to scrollDrainNode
```

### Descend to Continue Draining

```typescript
// We descend to continue draining
// Render reaches scrollDrainNode
// Continues pendingScrollDelta drain
// Drain continuation
# Frame-rate limited delta
```

### dirty Flag Cleared Issue

```typescript
// Without this, after the scrollbox's dirty flag is cleared (line ~721),
// the next frame blits root and never reaches the scrollbox — drain stalls
// dirty flag cleared at render
// Next frame blit skips descent
# Drain stalls without markDirty
```

### Drain Stall Prevention

```typescript
// Drain stalls without markDirty post-render
// scrollDrainNode + markDirty pattern prevents stall
// Ensures delta fully drained
// Prevent drain stall
# Complete delta drain
```

### resetScrollDrainNode

```typescript
export function resetScrollDrainNode(): void {
  scrollDrainNode = null
}
// Reset at frame start
// No pending delta
```

## 实现建议

### OpenClaw适配

1. **scrollDrainNode**: scrollDrainNode global
2. **markDirtyPostRender**: markDirty post-render pattern
3. **drainContinuation**: pendingScrollDelta drain continuation
4. **blitBypass**: blit optimization bypass pattern
5. **drainStallPrevention**: drain stall prevention

### 状态文件示例

```json
{
  "scrollDrainNode": "scrollbox_123",
  "pendingScrollDelta": 25,
  "drainedThisFrame": 15
}
```

## 关键模式

### Post-Render markDirty

```
render completes → markDirty(scrollDrainNode) → next frame blit fails → descend to drain
# 渲染完成后markDirty
# 下帧blit优化失效
# 强制descend到scrollDrainNode
# 继续drain
```

### Frame-Rate Limited Drain

```
pendingScrollDelta → SCROLL_MAX_PER_FRAME per frame → remaining → next frame drain
# 每帧drain限制
# 剩余delta下帧继续
# 跨帧drain continuation
```

### Blit Optimization Bypass

```
dirty=false → blit skips descent | markDirty → dirty=true → blit fails → descend
# dirty=false时blit跳过descend
# markDirty强制dirty=true
# blit优化失效
# 必须descend
```

### Drain Stall Prevention

```
dirty cleared → next frame blit → never reach scrollbox → drain stalls | markDirty prevents
# dirty cleared后drain stalls
# markDirty防止stall
# 确保完整drain
```

## 借用价值

- ⭐⭐⭐⭐⭐ scrollDrainNode pattern
- ⭐⭐⭐⭐⭐ Post-render markDirty pattern
- ⭐⭐⭐⭐⭐ Frame-rate limited drain continuation
- ⭐⭐⭐⭐⭐ Blit optimization bypass pattern
- ⭐⭐⭐⭐⭐ Drain stall prevention pattern

## 来源

- Claude Code: `ink/render-node-to-output.ts` (1462 lines)
- 分析报告: P49-6