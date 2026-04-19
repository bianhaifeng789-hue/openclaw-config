# Lazy Import Pattern Skill

Lazy Import Pattern - getLockfile() accessor + proper-lockfile lazy require + graceful-fs monkey-patch cost + _lockfile undefined check + require on first use + static import cost avoidance + lock/unlock/check functions + LockOptions/UnlockOptions types + startup path optimization。

## 功能概述

从Claude Code的utils/lockfile.ts提取的Lazy import模式，用于OpenClaw的延迟加载优化。

## 核心机制

### getLockfile() Accessor

```typescript
let _lockfile: Lockfile | undefined

function getLockfile(): Lockfile {
  if (!_lockfile) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _lockfile = require('proper-lockfile') as Lockfile
  }
  return _lockfile
}
// Lazy accessor for proper-lockfile
# require on first use
# Undefined check
```

### proper-lockfile Lazy Require

```typescript
require('proper-lockfile') as Lockfile
// Require only when first lock function called
# Not imported at module load
```

### graceful-fs Monkey-Patch Cost

```typescript
// proper-lockfile depends on graceful-fs, which monkey-patches every fs
// method on first require (~8ms). Static imports of proper-lockfile pull this
// cost into the startup path even when no locking happens (e.g. `--help`).
// graceful-fs monkey-patches all fs methods
# ~8ms cost on first require
# Static import pulls cost into startup
```

### _lockfile undefined Check

```typescript
if (!_lockfile) {
  _lockfile = require('proper-lockfile') as Lockfile
}
// Check if already loaded
# Undefined → require
# Defined → return cached
```

### require on First Use

```typescript
// Import this module instead of `proper-lockfile` directly.
// The underlying package is only loaded the first time a lock function is actually called.
// Load on first use
# Not at startup
```

### static Import Cost Avoidance

```typescript
// Static imports of proper-lockfile pull this cost into the startup path
// even when no locking happens (e.g. `--help`).
// Avoid cost in startup path
# --help doesn't need lockfile
```

### lock/unlock/check Functions

```typescript
export function lock(
  file: string,
  options?: LockOptions,
): Promise<() => Promise<void>> {
  return getLockfile().lock(file, options)
}

export function lockSync(file: string, options?: LockOptions): () => void {
  return getLockfile().lockSync(file, options)
}

export function unlock(file: string, options?: UnlockOptions): Promise<void> {
  return getLockfile().unlock(file, options)
}

export function check(file: string, options?: CheckOptions): Promise<boolean> {
  return getLockfile().check(file, options)
}
// Export wrapper functions
# Call getLockfile() → require if needed
```

### LockOptions/UnlockOptions Types

```typescript
import type { CheckOptions, LockOptions, UnlockOptions } from 'proper-lockfile'
// Import types only (no runtime cost)
# type imports are erased
```

### startup Path Optimization

```typescript
// Import this module instead of `proper-lockfile` directly
// Lazy load avoids startup cost
# --help fast startup
# Locking features optional
```

## 实现建议

### OpenClaw适配

1. **lazyAccessor**: getLockfile() accessor pattern
2. **lazyRequire**: Lazy require on first use
3. **monkeyPatchCost**: Monkey-patch cost avoidance
4. **typeImportErased**: type imports erased pattern
5. **wrapperFunctions**: Wrapper functions pattern

### 状态文件示例

```json
{
  "lockfileLoaded": false,
  "firstCall": true,
  "costSavedMs": 8
}
```

## 关键模式

### Lazy Accessor Pattern

```
let _pkg; function get() { if (!_pkg) _pkg = require('pkg'); return _pkg } → lazy load
# lazy accessor pattern
# undefined check
# require on first use
```

### type Import Erased

```
import type { Options } from 'pkg' → no runtime cost → types erased → startup unaffected
# type imports erased
# 无runtime cost
# startup不受影响
```

### Monkey-Patch Cost Avoidance

```
graceful-fs monkey-patches fs (~8ms) → static import pulls to startup → lazy import avoids
# graceful-fs monkey-patches
# ~8ms cost
# static import拉入startup
# lazy import避免
```

### Wrapper Functions

```
export function lock() { return getLockfile().lock() } → lazy require → wrapper functions
# wrapper functions
# 调用lazy accessor
# require on first call
```

### Startup Path Optimization

```
--help → no lock → lazy import not triggered → 8ms saved → startup optimization
# --help不需要lock
# lazy import未触发
# 8ms saved
```

## 借用价值

- ⭐⭐⭐⭐⭐ Lazy accessor pattern
- ⭐⭐⭐⭐⭐ type imports erased pattern
- ⭐⭐⭐⭐⭐ Monkey-patch cost avoidance
- ⭐⭐⭐⭐⭐ Wrapper functions pattern
- ⭐⭐⭐⭐⭐ Startup path optimization

## 来源

- Claude Code: `utils/lockfile.ts` (43 lines)
- 分析报告: P52-5