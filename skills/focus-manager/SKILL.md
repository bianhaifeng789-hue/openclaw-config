# Focus Manager Skill

Focus Manager - FocusManager class + MAX_FOCUS_STACK + deduplicate stack + handleNodeRemoved + activeElement tracking + FocusEvent dispatch。

## 功能概述

从Claude Code的ink/focus.ts提取的焦点管理模式，用于OpenClaw的UI焦点管理。

## 核心机制

### FocusManager Class

```typescript
export class FocusManager {
  activeElement: DOMElement | null = null
  private enabled = true
  private focusStack: DOMElement[] = []
  
  constructor(dispatchFocusEvent: (target, event) => boolean) {
    this.dispatchFocusEvent = dispatchFocusEvent
  }
}
// Class for DOM-like focus management
// activeElement: current focus
// focusStack: history stack
// enabled: toggle
```

### MAX_FOCUS_STACK

```typescript
const MAX_FOCUS_STACK = 32

if (this.focusStack.length > MAX_FOCUS_STACK) {
  this.focusStack.shift()  // Remove oldest
}
// Bounded stack size
// Prevent unbounded growth
// 32 elements max
```

### Deduplicate Stack

```typescript
// Deduplicate before pushing to prevent unbounded growth from Tab cycling
const idx = this.focusStack.indexOf(previous)
if (idx !== -1) this.focusStack.splice(idx, 1)
this.focusStack.push(previous)
// Remove if already exists
// Prevent duplicates from Tab cycling
// Keep stack bounded
```

### handleNodeRemoved

```typescript
/**
 * Called by reconciler when node is removed from tree.
 * Handles both the exact node AND any focused descendant within
 * the removed subtree. Dispatches blur and restores from stack.
 */
handleNodeRemoved(node: DOMElement, root: DOMElement): void {
  // Remove node and descendants from stack
  this.focusStack = this.focusStack.filter(
    n => n !== node && isInTree(n, root),
  )

  // Check if activeElement is removed node OR descendant
  if (!this.activeElement) return
  if (this.activeElement !== node && isInTree(this.activeElement, root)) {
    return
  }

  const removed = this.activeElement
  this.activeElement = null
  this.dispatchFocusEvent(removed, new FocusEvent('blur', null))

  // Restore focus to most recent still-mounted element
  while (this.focusStack.length > 0) {
    const candidate = this.focusStack.pop()!
    if (isInTree(candidate, root)) {
      this.activeElement = candidate
      this.dispatchFocusEvent(candidate, new FocusEvent('focus', removed))
      return
    }
  }
}
// Reconciler call on node removal
// Handle node and descendants
// Restore from stack
```

### Focus/Blur Events

```typescript
focus(node: DOMElement): void {
  if (node === this.activeElement) return
  if (!this.enabled) return

  const previous = this.activeElement
  if (previous) {
    // Deduplicate + push to stack
    this.dispatchFocusEvent(previous, new FocusEvent('blur', node))
  }
  this.activeElement = node
  this.dispatchFocusEvent(node, new FocusEvent('focus', previous))
}

blur(): void {
  if (!this.activeElement) return
  const previous = this.activeElement
  this.activeElement = null
  this.dispatchFocusEvent(previous, new FocusEvent('blur', null))
}
// Focus: previous blur + node focus
// Blur: activeElement to null
// FocusEvent dispatch
```

### FocusEvent Class

```typescript
import { FocusEvent } from './events/focus-event.js'

new FocusEvent('blur', relatedTarget)
new FocusEvent('focus', relatedTarget)
// FocusEvent type + relatedTarget
// Like DOM FocusEvent
```

### isInTree Helper

```typescript
// Check if node is still in tree (mounted)
if (isInTree(candidate, root)) { ... }
// Verify node still mounted
// Before restoring focus
// Prevent focus on removed node
```

## 实现建议

### OpenClaw适配

1. **focusManager**: FocusManager class
2. **maxStack**: MAX_FOCUS_STACK = 32
3. **deduplicate**: Deduplicate pattern
4. **handleRemoved**: handleNodeRemoved
5. **restoreFromStack**: Stack-based restore

### 状态文件示例

```json
{
  "activeElement": "input-box",
  "focusStackSize": 5,
  "enabled": true
}
```

## 关键模式

### Bounded Stack

```
MAX_FOCUS_STACK = 32 → shift() on overflow → bounded growth
// 32上限
// overflow时shift最旧
```

### Deduplicate Pattern

```
indexOf(previous) → splice if exists → push → no duplicates
// Tab cycling可能重复
// 先检查再push
```

### Node Removal Handling

```
handleNodeRemoved → filter stack + check activeElement + restore from stack
// node移除时处理
// 检查descendant
// stack恢复focus
```

### Restore Loop

```
while (stack.length > 0) → pop + isInTree check → restore
// 循环pop直到找到mounted element
// isInTree验证
```

## 借用价值

- ⭐⭐⭐⭐⭐ FocusManager class pattern
- ⭐⭐⭐⭐⭐ MAX_FOCUS_STACK bound
- ⭐⭐⭐⭐⭐ Deduplicate stack pattern
- ⭐⭐⭐⭐⭐ handleNodeRemoved (descendant handling)
- ⭐⭐⭐⭐ Restore from stack loop

## 来源

- Claude Code: `ink/focus.ts`
- 分析报告: P44-4