---
name: memoize-utils
description: "Memoization utilities. memoizeWithTTL (5 min default) + memoizeWithTTLAsync + memoizeWithLRU + CacheEntry + Background refresh + inFlight dedup + LRU cache. Use when [memoize utils] is needed."
metadata:
  openclaw:
    emoji: "💾"
    triggers: [memoize, ttl-cache]
    feishuCard: true
---

# Memoize Utils Skill - Memoize Utils

Memoize Utils 缓存工具集。

## 为什么需要这个？

**场景**：
- TTL-based memoization（5 min）
- Background refresh pattern
- LRU cache（bounded）
- Async dedup（inFlight）
- Cache invalidation

**Claude Code 方案**：memoize.ts + 270+ lines
**OpenClaw 飞书适配**：Memoize utils + TTL caching

---

## Types

### CacheEntry

```typescript
type CacheEntry<T> = {
  value: T
  timestamp: number
  refreshing: boolean // Background refresh flag
}
```

### MemoizedFunction

```typescript
type MemoizedFunction<Args extends unknown[], Result> = {
  (...args: Args): Result
  cache: {
    clear: () => void
  }
}
```

---

## Functions

### 1. TTL Memoization

```typescript
export function memoizeWithTTL<Args extends unknown[], Result>(
  f: (...args: Args) => Result,
  cacheLifetimeMs: number = 5 * 60 * 1000, // 5 minutes
): MemoizedFunction<Args, Result> {
  const cache = new Map<string, CacheEntry<Result>>()

  const memoized = (...args: Args): Result => {
    const key = jsonStringify(args)
    const cached = cache.get(key)
    const now = Date.now()

    // Cold miss: compute and cache
    if (!cached) {
      const value = f(...args)
      cache.set(key, { value, timestamp: now, refreshing: false })
      return value
    }

    // Stale cache + not refreshing: background refresh
    if (now - cached.timestamp > cacheLifetimeMs && !cached.refreshing) {
      cached.refreshing = true
      
      Promise.resolve()
        .then(() => {
          const newValue = f(...args)
          // Identity-guard: only update if still cached
          if (cache.get(key) === cached) {
            cache.set(key, { value: newValue, timestamp: Date.now(), refreshing: false })
          }
        })
        .catch(e => {
          logError(e)
          if (cache.get(key) === cached) cache.delete(key)
        })
      
      // Return stale value immediately
      return cached.value
    }

    return cached.value
  }

  memoized.cache = { clear: () => cache.clear() }
  return memoized
}
```

### 2. Async TTL Memoization

```typescript
export function memoizeWithTTLAsync<Args extends unknown[], Result>(
  f: (...args: Args) => Promise<Result>,
  cacheLifetimeMs = 5 * 60 * 1000,
): ((...args: Args) => Promise<Result>) & { cache: { clear: () => void } } {
  const cache = new Map<string, CacheEntry<Result>>()
  // In-flight dedup for cold misses
  const inFlight = new Map<string, Promise<Result>>()

  const memoized = async (...args: Args): Promise<Result> => {
    const key = jsonStringify(args)
    const cached = cache.get(key)
    const now = Date.now()

    // Cold miss: dedup in-flight
    if (!cached) {
      const pending = inFlight.get(key)
      if (pending) return pending
      
      const promise = f(...args)
      inFlight.set(key, promise)
      
      try {
        const result = await promise
        if (inFlight.get(key) === promise) {
          cache.set(key, { value: result, timestamp: Date.now(), refreshing: false })
        }
        return result
      } finally {
        if (inFlight.get(key) === promise) inFlight.delete(key)
      }
    }

    // Stale: background refresh (async)
    if (now - cached.timestamp > cacheLifetimeMs && !cached.refreshing) {
      cached.refreshing = true
      f(...args)
        .then(newValue => {
          if (cache.get(key) === cached) {
            cache.set(key, { value: newValue, timestamp: Date.now(), refreshing: false })
          }
        })
        .catch(e => {
          logError(e)
          if (cache.get(key) === cached) cache.delete(key)
        })
    }

    return cached.value
  }

  memoized.cache = {
    clear: () => {
      cache.clear()
      inFlight.clear()
    },
  }
  return memoized
}
```

### 3. LRU Memoization

```typescript
export function memoizeWithLRU<Args extends unknown[], Result>(
  f: (...args: Args) => Result,
  keyFn: (args: Args) => string,
  max: number,
): LRUMemoizedFunction<Args, Result> {
  const cache = new LRUCache<string, Result>({ max })

  const memoized = (...args: Args): Result => {
    const key = keyFn(args)
    if (cache.has(key)) return cache.get(key)!
    const result = f(...args)
    cache.set(key, result)
    return result
  }

  memoized.cache = {
    clear: () => cache.clear(),
    size: () => cache.size,
    delete: (key: string) => cache.delete(key),
    get: (key: string) => cache.get(key),
    has: (key: string) => cache.has(key),
  }
  return memoized
}
```

---

## 飞书卡片格式

### Memoize Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**💾 Memoize Utils**\n\n---\n\n**Functions**：\n• memoizeWithTTL(f, 5min) - TTL cache\n• memoizeWithTTLAsync(f, 5min) - Async TTL\n• memoizeWithLRU(f, keyFn, max) - LRU cache\n\n---\n\n**Patterns**：\n• Background refresh（stale → return + refresh）\n• inFlight dedup（async cold-miss）\n• Identity-guard（cache.clear safety）\n\n---\n\n**CacheEntry**：\n```json\n{\n  \"value\": T,\n  \"timestamp\": number,\n  \"refreshing\": boolean\n}\n```"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/memoize-utils-state.json
{
  "stats": {
    "cacheHits": 0,
    "cacheMisses": 0
  },
  "lastUpdate": "2026-04-12T11:14:00Z",
  "notes": "Memoize Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| memoize.ts (270+ lines) | Skill + Memoize |
| memoizeWithTTL() | TTL cache |
| memoizeWithLRU() | LRU |
| Background refresh | Refresh pattern |

---

## 注意事项

1. **TTL default**：5 minutes
2. **Background refresh**：Return stale + refresh async
3. **inFlight dedup**：Async cold-miss sharing
4. **Identity-guard**：cache.clear() safety
5. **LRU cache**：Bounded growth

---

## 自动启用

此 Skill 在 memoization 时自动运行。

---

## 下一步增强

- 飞书 memoize 集成
- Cache analytics
- Cache debugging