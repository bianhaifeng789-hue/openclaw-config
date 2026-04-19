# Memoize TTL Skill

**优先级**: P30
**来源**: Claude Code `memoize.ts`
**适用场景**: 飞书API缓存、后台刷新

---

## 概述

Memoize TTL提供带TTL的缓存函数，支持后台刷新模式：缓存新鲜时立即返回；缓存过期时返回旧值并在后台刷新；无缓存时阻塞计算。

---

## 核心功能

### 1. Sync版本

```typescript
export function memoizeWithTTL<Args extends unknown[], Result>(
  f: (...args: Args) => Result,
  cacheLifetimeMs: number = 5 * 60 * 1000 // Default 5 minutes
): MemoizedFunction<Args, Result>
```

### 2. Async版本

```typescript
export function memoizeWithTTLAsync<Args extends unknown[], Result>(
  f: (...args: Args) => Promise<Result>,
  cacheLifetimeMs: number = 5 * 60 * 1000
): ((...args: Args) => Promise<Result>) & { cache: { clear: () => void } }
```

### 3. LRU版本

```typescript
export function memoizeWithLRUCache<Args extends unknown[], Result>(
  f: (...args: Args) => Promise<Result>,
  options?: { max?: number; ttl?: number }
): LRUMemoizedFunction<Args, Result>
```

---

## 实现要点

### 1. Write-through Cache

```typescript
// Populate cache
if (!cached) {
  const value = f(...args)
  cache.set(key, { value, timestamp: now, refreshing: false })
  return value
}

// Stale cache: return immediately + refresh in background
if (now - cached.timestamp > cacheLifetimeMs && !cached.refreshing) {
  cached.refreshing = true
  Promise.resolve().then(() => {
    const newValue = f(...args)
    cache.set(key, { value: newValue, timestamp: Date.now(), refreshing: false })
  })
  return cached.value // Return stale immediately
}

// Fresh cache: return cached
return cached.value
```

### 2. In-flight Dedup (Async)

```typescript
// 防止并发cold-miss重复调用
const inFlight = new Map<string, Promise<Result>>()

const pending = inFlight.get(key)
if (pending) return pending // Share the same promise

const promise = f(...args)
inFlight.set(key, promise)
const result = await promise
// Identity-guard: cache.clear() during await should discard
if (inFlight.get(key) === promise) {
  cache.set(key, { value: result, timestamp: Date.now() })
}
inFlight.delete(key)
```

---

## OpenClaw应用

### 1. 飞书API缓存

```typescript
// 缓存飞书用户信息
const getCachedUserInfo = memoizeWithTTLAsync(
  async (userId: string) => {
    return await feishuApi.getUserInfo(userId)
  },
  5 * 60 * 1000 // 5分钟TTL
)

// 使用
const user = await getCachedUserInfo(userId)
// 第一次: 调用API
// 5分钟内: 返回缓存
// 5分钟后: 返回旧缓存 + 后台刷新
```

### 2. 飞书群聊列表

```typescript
const getCachedChatList = memoizeWithTTLAsync(
  async () => feishuApi.getChatList(),
  10 * 60 * 1000 // 10分钟TTL
)
```

---

## 状态文件

```json
{
  "skill": "memoize-ttl",
  "priority": "P30",
  "source": "memoize.ts",
  "enabled": true,
  "defaultTTL": 300000,
  "variants": ["sync", "async", "lru"],
  "createdAt": "2026-04-12T13:30:00Z"
}
```

---

## 参考

- Claude Code: `memoize.ts`