# WeakRef Abort Propagation Pattern Skill

WeakRef Abort Propagation Pattern - createChildAbortController + WeakRef parent/child + propagateAbort module-scope + removeAbortHandler cleanup + auto-cleanup on child abort + GC-safe weak references + setMaxListeners + {once: true} listener + parent→child propagation + child→parent cleanup。

## 功能概述

从Claude Code的utils/abortController.ts提取的WeakRef abort propagation模式，用于OpenClaw的Abort安全传播。

## 核心机制

### createChildAbortController

```typescript
export function createChildAbortController(
  parent: AbortController,
  maxListeners?: number,
): AbortController {
  const child = createAbortController(maxListeners)

  // Fast path: parent already aborted
  if (parent.signal.aborted) {
    child.abort(parent.signal.reason)
    return child
  }

  // WeakRef prevents parent from keeping abandoned child alive
  const weakChild = new WeakRef(child)
  const weakParent = new WeakRef(parent)
  const handler = propagateAbort.bind(weakParent, weakChild)

  parent.signal.addEventListener('abort', handler, { once: true })

  // Auto-cleanup: remove parent listener when child is aborted
  child.signal.addEventListener(
    'abort',
    removeAbortHandler.bind(weakParent, new WeakRef(handler)),
    { once: true },
  )

  return child
}
// Create child AbortController
# Aborts when parent aborts
# WeakRef memory-safe
# Auto-cleanup
```

### WeakRef parent/child

```typescript
const weakChild = new WeakRef(child)
const weakParent = new WeakRef(parent)
// WeakRef for parent and child
# Neither direction creates strong reference
# Child can be GC'd if dropped
# Parent doesn't retain child
```

### propagateAbort module-scope

```typescript
function propagateAbort(
  this: WeakRef<AbortController>,
  weakChild: WeakRef<AbortController>,
): void {
  const parent = this.deref()
  weakChild.deref()?.abort(parent?.signal.reason)
}
// Module-scope function
# Avoids per-call closure allocation
# this = weakParent
# weakChild parameter
```

### removeAbortHandler cleanup

```typescript
function removeAbortHandler(
  this: WeakRef<AbortController>,
  weakHandler: WeakRef<(...args: unknown[]) => void>,
): void {
  const parent = this.deref()
  const handler = weakHandler.deref()
  if (parent && handler) {
    parent.signal.removeEventListener('abort', handler)
  }
}
// Remove abort handler from parent
# Called when child aborts
# Both parent and handler weakly held
# No-op if already GC'd
```

### auto-cleanup on child abort

```typescript
child.signal.addEventListener(
  'abort',
  removeAbortHandler.bind(weakParent, new WeakRef(handler)),
  { once: true },
)
// Auto-cleanup when child aborts
# Remove parent listener
# Prevent accumulation of dead handlers
```

### GC-safe weak references

```typescript
// Both parent and child are weakly held — neither direction creates a
// strong reference that could prevent GC. If the child is dropped without
// being aborted, it can still be GC'd — the parent only holds a dead WeakRef.
// GC-safe weak references
# Child dropped → GC'd
# Parent holds dead WeakRef
# No strong reference leak
```

### setMaxListeners

```typescript
export function createAbortController(
  maxListeners: number = DEFAULT_MAX_LISTENERS,
): AbortController {
  const controller = new AbortController()
  setMaxListeners(maxListeners, controller.signal)
  return controller
}
// Set max listeners
# Prevent MaxListenersExceededWarning
# Default: 50 listeners
```

### {once: true} listener

```typescript
parent.signal.addEventListener('abort', handler, { once: true })
// Once listener
# Auto-remove after fired
# No manual cleanup needed
```

### parent→child propagation

```typescript
// Aborting the child does NOT affect the parent
// Parent abort → child abort (one-way)
# Child doesn't affect parent
# One-way propagation
```

### child→parent cleanup

```typescript
// When child IS aborted, the parent listener is removed
child.signal.addEventListener('abort', removeAbortHandler, { once: true })
// Child abort → remove parent listener
# Cleanup parent handler
# Prevent dead handler accumulation
```

## 实现建议

### OpenClaw适配

1. **weakRefAbort**: createChildAbortController WeakRef pattern
2. **moduleScopeHandler**: propagateAbort module-scope pattern
3. **autoCleanup**: Auto-cleanup on child abort pattern
4. **gcSafeWeak**: GC-safe weak references pattern
5. **setMaxListeners**: setMaxListeners pattern

### 状态文件示例

```json
{
  "parent": "AbortController",
  "child": "AbortController",
  "aborted": false,
  "maxListeners": 50
}
```

## 关键模式

### WeakRef双向避免Strong Reference

```
WeakRef(parent) + WeakRef(child) → neither strong → child dropped → GC'd → parent holds dead WeakRef
# WeakRef双向避免strong reference
# child dropped时GC'd
# parent holds dead WeakRef
```

### Module-Scope Handler No Closure

```
propagateAbort.bind(weakParent, weakChild) → module-scope → no per-call closure → allocation avoided
# module-scope handler
# 避免per-call closure allocation
# bind reuse
```

### Auto-Cleanup Remove Parent Listener

```
child abort → removeAbortHandler → parent.removeEventListener → cleanup → no dead handler accumulation
# auto-cleanup pattern
# child abort时remove parent listener
# 防止dead handler accumulation
```

### {once: true} Auto-Remove

```
addEventListener('abort', handler, {once: true}) → auto-remove after fire → no manual cleanup
# {once: true} auto-remove
# 触发后自动remove
# 无需manual cleanup
```

### setMaxListeners Prevent Warning

```
setMaxListeners(50, controller.signal) → prevent MaxListenersExceededWarning → multiple listeners OK
# setMaxListeners防止warning
# 多listeners不warning
# 50 default
```

## 借用价值

- ⭐⭐⭐⭐⭐ WeakRef双向GC-safe pattern
- ⭐⭐⭐⭐⭐ Module-scope handler no closure pattern
- ⭐⭐⭐⭐⭐ Auto-cleanup remove parent listener pattern
- ⭐⭐⭐⭐⭐ {once: true} auto-remove pattern
- ⭐⭐⭐⭐⭐ setMaxListeners prevent warning pattern

## 来源

- Claude Code: `utils/abortController.ts` (107 lines)
- 分析报告: P56-3