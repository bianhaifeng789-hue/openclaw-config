# Write-Through Cache Pattern Skill

Write-Through Cache Pattern - memoizeWithTTL + stale value return + background refresh + refreshing flag + in-flight dedup + identity guard + cache.clear race handling + CacheEntry type + timestamp check + Promise.resolve().then() async refresh + error cache.delete。

## 功能概述

从Claude Code的utils/memoize.ts提取的Write-through cache模式，用于OpenClaw的缓存刷新策略。

## 核心机制

### memoizeWithTTL Function

```typescript
export function memoizeWithTTL<Args extends unknown[], Result>(
  f: (...args: Args) => Result,
  cacheLifetimeMs: number = 5 * 60 * 1000,  // Default 5 minutes
): MemoizedFunction<Args, Result> {
  const cache = new Map<string, CacheEntry<Result>>()
  // ...
}
// Memoize with TTL
# Default 5 minutes
```

### CacheEntry Type

```typescript
type CacheEntry<T> = {
  value: T
  timestamp: number
  refreshing: boolean  // Background refresh flag
}
// Cache entry structure
# timestamp: creation time
# refreshing: async refresh status
```

### stale Value Return

```typescript
// If cache is stale, return the stale value but refresh it in the background
if (
  cached &&
  now - cached.timestamp > cacheLifetimeMs &&
  !cached.refreshing
) {
  cached.refreshing = true  // Mark as refreshing
  // Schedule async refresh (non-blocking)
  Promise.resolve().then(() => { /* refresh */ })
  // Return the stale value immediately
  return cached.value
}
// Return stale, refresh background
# Non-blocking
```

### background Refresh

```typescript
Promise.resolve()
  .then(() => {
    const newValue = f(...args)
    if (cache.get(key) === cached) {  // Identity guard
      cache.set(key, {
        value: newValue,
        timestamp: Date.now(),
        refreshing: false,
      })
    }
  })
  .catch(e => {
    logError(e)
    if (cache.get(key) === cached) {  // Identity guard
      cache.delete(key)  // Delete on error
    }
  })
// Schedule async refresh
# Identity guard before update
# .catch deletes cache
```

### refreshing Flag

```typescript
cached.refreshing = true  // Mark as refreshing to prevent multiple parallel refreshes
// Prevent concurrent refreshes
# Single background refresh
```

### in-flight Dedup (Async Version)

```typescript
// In-flight cold-miss dedup. The old memoizeWithTTL (sync) accidentally
// provided this: it stored the Promise synchronously before the first
// await, so concurrent callers shared one f() invocation. This async
// variant awaits before cache.set, so concurrent cold-miss callers would
// each invoke f() independently without this map.
const inFlight = new Map<string, Promise<Result>>()

const pending = inFlight.get(key)
if (pending) return pending  // Return existing promise
const promise = f(...args)
inFlight.set(key, promise)
// In-flight deduplication
# Concurrent callers share one invocation
```

### identity Guard

```typescript
if (cache.get(key) === cached) {
  // Update or delete
}
// Identity guard: cache.clear() during await should discard result
# Prevent stale update after clear
```

### cache.clear Race Handling

```typescript
// Identity-guard: cache.clear() during the await should discard this result
// (clear intent is to invalidate). If we're still in-flight, store it.
// clear() wipes inFlight too, so this check catches that.
if (inFlight.get(key) === promise) {
  cache.set(key, { /* ... */ })
}
// Handle race with cache.clear
# Identity check before update
```

### timestamp Check

```typescript
if (now - cached.timestamp > cacheLifetimeMs && !cached.refreshing) {
  // Refresh needed
}
// TTL check
# timestamp > TTL → stale
```

### error cache.delete

```typescript
.catch(e => {
  logError(e)
  if (cache.get(key) === cached) {
    cache.delete(key)  // Delete on error (self-correcting)
  }
})
// Delete cache on error
# Self-correcting on next call
# Better than persisting wrong data
```

## 实现建议

### OpenClaw适配

1. **memoizeWithTTL**: memoizeWithTTL function
2. **staleReturn**: Stale value return pattern
3. **backgroundRefresh**: Background refresh pattern
4. **inFlightDedup**: in-flight deduplication
5. **identityGuard**: Identity guard pattern

### 状态文件示例

```json
{
  "cacheKey": "args-hash",
  "timestamp": 1234567890,
  "refreshing": true,
  "ttl": 300000
}
```

## 关键模式

### Stale Return + Background Refresh

```
stale cache → return immediately → refresh background → non-blocking → fresh next call
# stale cache立即返回
# background异步refresh
# 非阻塞
# 下次调用fresh
```

### refreshing Flag Prevention

```
refreshing=true → prevent concurrent refresh → single background refresh → avoid parallel f() calls
# refreshing flag防止并发refresh
# 单一background refresh
# 避免多次f()调用
```

### in-flight Dedup Async

```
inFlight map → concurrent cold-miss share promise → one f() invocation → multiple callers
# in-flight deduplication
# 并发cold-miss共享promise
# 一次f()调用
```

### Identity Guard Race Handling

```
cache.get(key) === cached → identity check → cache.clear race → discard stale result
# identity guard检查
# cache.clear race处理
# 丢弃stale result
```

### Error Delete vs Persist Wrong

```
error → cache.delete (self-correcting) > persist wrong data (stays for TTL)
# error时delete cache
# 自纠正on next call
# 比persist wrong data更好
```

## 借用价值

- ⭐⭐⭐⭐⭐ Write-through cache pattern (stale return + background refresh)
- ⭐⭐⭐⭐⭐ refreshing flag prevention pattern
- ⭐⭐⭐⭐⭐ in-flight dedup async pattern
- ⭐⭐⭐⭐⭐ Identity guard race handling
- ⭐⭐⭐⭐⭐ error delete vs persist wrong pattern

## 来源

- Claude Code: `utils/memoize.ts` (269 lines)
- 分析报告: P52-3