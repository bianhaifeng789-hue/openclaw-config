# Abort-Safe Sleep Pattern Skill

Abort-Safe Sleep Pattern - sleep function + AbortSignal responsive + signal?.aborted check BEFORE timer + throwOnAbort option + abortError custom + unref timer + removeEventListener cleanup + setTimeout unref + withTimeout race + Promise.race pattern。

## 功能概述

从Claude Code的utils/sleep.ts提取的Abort-safe sleep模式，用于OpenClaw的响应式延迟。

## 核心机制

### sleep Function

```typescript
export function sleep(
  ms: number,
  signal?: AbortSignal,
  opts?: { throwOnAbort?: boolean; abortError?: () => Error; unref?: boolean },
): Promise<void> {
  return new Promise((resolve, reject) => {
    // ...
  })
}
// Abort-responsive sleep
# Resolves after ms OR on signal abort
```

### AbortSignal Responsive

```typescript
signal?.addEventListener('abort', onAbort, { once: true })
// Listen to abort signal
# Abort → resolve immediately (or reject)
# Backoff loops don't block shutdown
```

### signal?.aborted check BEFORE timer

```typescript
// Check aborted state BEFORE setting up the timer. If we defined
// onAbort first and called it synchronously here, it would reference
// `timer` while still in the Temporal Dead Zone.
if (signal?.aborted) {
  if (opts?.throwOnAbort || opts?.abortError) {
    void reject(opts.abortError?.() ?? new Error('aborted'))
  } else {
    void resolve()
  }
  return
}
// Check BEFORE timer setup
# Avoids TDZ (Temporal Dead Zone)
# timer not defined yet
```

### throwOnAbort Option

```typescript
if (opts?.throwOnAbort || opts?.abortError) {
  void reject(opts.abortError?.() ?? new Error('aborted'))
} else {
  void resolve()
}
// throwOnAbort: reject vs resolve
# Default: resolve silently
# throwOnAbort: reject with error
```

### abortError Custom

```typescript
opts.abortError?.() ?? new Error('aborted')
// Custom abort error
# Useful for retry loops catching specific error class
# e.g., APIUserAbortError
```

### unref Timer

```typescript
const timer = setTimeout(...)
if (opts?.unref) {
  timer.unref()
}
// unref: don't block process exit
# Allow process to exit while timer pending
```

### removeEventListener Cleanup

```typescript
const timer = setTimeout(
  (signal, onAbort, resolve) => {
    signal?.removeEventListener('abort', onAbort)
    void resolve()
  },
  ms,
  signal,
  onAbort,
  resolve,
)
// Cleanup on timer resolve
# removeEventListener('abort', onAbort)
# Prevent memory leak
```

### setTimeout unref

```typescript
timer.unref()
// Don't block process exit
# Timer doesn't keep Node process alive
```

### withTimeout Race

```typescript
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(rejectWithTimeout, ms, reject, message)
    if (typeof timer === 'object') timer.unref?.()
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer !== undefined) clearTimeout(timer)
  })
}
// Race promise against timeout
# Timeout rejects with Error(message)
# unref timer
# finally clears timer
```

### Promise.race Pattern

```typescript
Promise.race([promise, timeoutPromise]).finally(() => {
  if (timer !== undefined) clearTimeout(timer)
})
// Race between promise and timeout
# Timeout wins → reject
# Promise wins → resolve
# finally cleanup timer
```

## 实现建议

### OpenClaw适配

1. **abortSafeSleep**: sleep + AbortSignal pattern
2. **abortedCheckBefore**: signal?.aborted check BEFORE timer
3. **throwOnAbort**: throwOnAbort option pattern
4. **unrefTimer**: timer.unref() pattern
5. **withTimeoutRace**: withTimeout + Promise.race pattern

### 状态文件示例

```json
{
  "ms": 1000,
  "aborted": false,
  "throwOnAbort": false,
  "unref": true
}
```

## 关键模式

### Aborted Check BEFORE Timer

```
signal?.aborted check → BEFORE timer setup → avoid TDZ → timer not defined yet
# 在timer setup之前check abort
# 避免Temporal Dead Zone
# timer还未定义
```

### Abort → Resolve or Reject

```
throwOnAbort=false → resolve silently | throwOnAbort=true → reject with error → different behavior
# throwOnAbort决定abort行为
# false: resolve silently
# true: reject with error
```

### timer.unref() Don't Block Exit

```
timer.unref() → don't block process exit → allow exit while pending → Node.js pattern
# timer.unref()不阻塞进程退出
# 允许在timer pending时exit
# Node.js pattern
```

### removeEventListener Cleanup

```
signal.removeEventListener('abort', onAbort) → cleanup on resolve → prevent memory leak
# removeEventListener cleanup
# 防止memory leak
# on resolve时cleanup
```

### Promise.race + finally Cleanup

```
Promise.race([promise, timeout]).finally(clearTimeout(timer)) → race + cleanup → no dangling timer
# Promise.race + finally cleanup
# 清除dangling timer
# 无论谁赢都cleanup
```

## 借用价值

- ⭐⭐⭐⭐⭐ Abort-safe sleep pattern
- ⭐⭐⭐⭐⭐ signal?.aborted check BEFORE timer pattern
- ⭐⭐⭐⭐⭐ throwOnAbort + abortError custom pattern
- ⭐⭐⭐⭐⭐ timer.unref() don't block exit pattern
- ⭐⭐⭐⭐⭐ withTimeout + Promise.race + finally pattern

## 来源

- Claude Code: `utils/sleep.ts` (84 lines)
- 分析报告: P55-1