# Combined Abort Signal Pattern Skill

Combined Abort Signal Pattern - createCombinedAbortSignal + signal + signalB + timeoutMs + cleanup function + setTimeout + clearTimeout cleanup + removeEventListener cleanup + unref timer + Bun AbortSignal.timeout memory leak avoid + multi-source abort。

## 功能概述

从Claude Code的utils/combinedAbortSignal.ts提取的Combined abort signal模式，用于OpenClaw的多源Abort组合。

## 核心机制

### createCombinedAbortSignal

```typescript
export function createCombinedAbortSignal(
  signal: AbortSignal | undefined,
  opts?: { signalB?: AbortSignal; timeoutMs?: number },
): { signal: AbortSignal; cleanup: () => void } {
  const { signalB, timeoutMs } = opts ?? {}
  const combined = createAbortController()

  // Fast path: already aborted
  if (signal?.aborted || signalB?.aborted) {
    combined.abort()
    return { signal: combined.signal, cleanup: () => {} }
  }

  // Setup listeners and timer
  // ...

  return { signal: combined.signal, cleanup }
}
// Combined abort signal
# Aborts on: signal abort, signalB abort, timeout
# Returns cleanup function
```

### signal + signalB + timeoutMs

```typescript
signal: AbortSignal | undefined  // Primary signal
signalB?: AbortSignal            // Secondary signal
timeoutMs?: number               // Timeout in milliseconds
// Three abort sources
# Primary signal
# Secondary signal
# Timeout
```

### cleanup Function

```typescript
return { signal: combined.signal, cleanup }
// cleanup: () => void
// Removes event listeners
// Clears timeout timer
# Cleanup on completion
```

### setTimeout + clearTimeout cleanup

```typescript
let timer: ReturnType<typeof setTimeout> | undefined
const abortCombined = () => {
  if (timer !== undefined) clearTimeout(timer)
  combined.abort()
}

if (timeoutMs !== undefined) {
  timer = setTimeout(abortCombined, timeoutMs)
  timer.unref?.()
}

const cleanup = () => {
  if (timer !== undefined) clearTimeout(timer)
  signal?.removeEventListener('abort', abortCombined)
  signalB?.removeEventListener('abort', abortCombined)
}
// Timer + cleanup
# setTimeout for timeout
# clearTimeout in cleanup
```

### removeEventListener cleanup

```typescript
const cleanup = () => {
  if (timer !== undefined) clearTimeout(timer)
  signal?.removeEventListener('abort', abortCombined)
  signalB?.removeEventListener('abort', abortCombined)
}
// Remove listeners in cleanup
# Prevent memory leak
# Cleanup on completion
```

### unref Timer

```typescript
timer = setTimeout(abortCombined, timeoutMs)
timer.unref?.()
// unref: don't block process exit
# Timer doesn't keep Node alive
```

### Bun AbortSignal.timeout memory leak avoid

```typescript
// Use `timeoutMs` instead of passing `AbortSignal.timeout(ms)` as a signal —
// under Bun, `AbortSignal.timeout` timers are finalized lazily and accumulate
// in native memory until they fire (measured ~2.4KB/call held for the full
// timeout duration). This implementation uses `setTimeout` + `clearTimeout`
// so the timer is freed immediately on cleanup.
// Bun AbortSignal.timeout memory leak
# ~2.4KB/call held for full timeout
# setTimeout + clearTimeout freed immediately
```

### multi-source abort

```typescript
signal?.addEventListener('abort', abortCombined)
signalB?.addEventListener('abort', abortCombined)
if (timeoutMs !== undefined) timer = setTimeout(abortCombined, timeoutMs)
// Three abort sources
# Any source → combined.abort()
# Multi-source abort
```

## 实现建议

### OpenClaw适配

1. **combinedAbort**: createCombinedAbortSignal pattern
2. **cleanupFunction**: cleanup function pattern
3. **timerCleanup**: setTimeout + clearTimeout pattern
4. **bunMemoryLeak**: Bun AbortSignal.timeout memory leak avoid pattern
5. **multiSource**: multi-source abort pattern

### 状态文件示例

```json
{
  "signal": "AbortSignal",
  "signalB": "AbortSignal",
  "timeoutMs": 30000,
  "aborted": false,
  "cleanup": "() => void"
}
```

## 关键模式

### cleanup Function Return

```
return {signal: combined.signal, cleanup: () => {...}} → cleanup removes listeners + clears timer → cleanup on completion
# cleanup function返回
# removes listeners + clears timer
# completion时cleanup
```

### setTimeout + clearTimeout Pattern

```
setTimeout → abortCombined | clearTimeout(timer) → cleanup → immediate free → no native memory accumulation
# setTimeout + clearTimeout pattern
# 立即free timer
# 无native memory accumulation
```

### Bun AbortSignal.timeout Memory Leak

```
AbortSignal.timeout(ms) → ~2.4KB/call native memory → lazy finalize → setTimeout/clearTimeout → immediate free
# Bun AbortSignal.timeout memory leak
# ~2.4KB/call native memory
# lazy finalize
# setTimeout/clearTimeout立即free
```

### unref Timer Don't Block Exit

```
timer.unref() → don't block process exit → allow Node exit while timer pending
# unref不阻塞exit
# Node可以在timer pending时exit
```

### Multi-Source Abort Any Triggers

```
signal abort | signalB abort | timeout → combined.abort() → any source → abort
# multi-source abort
# 任一source触发abort
```

## 借用价值

- ⭐⭐⭐⭐⭐ cleanup function return pattern
- ⭐⭐⭐⭐⭐ setTimeout + clearTimeout pattern
- ⭐⭐⭐⭐⭐ Bun AbortSignal.timeout memory leak avoid pattern
- ⭐⭐⭐⭐⭐ unref timer pattern
- ⭐⭐⭐⭐⭐ Multi-source abort pattern

## 来源

- Claude Code: `utils/combinedAbortSignal.ts` (64 lines)
- 分析报告: P56-4