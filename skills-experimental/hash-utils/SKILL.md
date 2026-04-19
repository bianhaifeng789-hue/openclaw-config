# Hash Utils Skill

**优先级**: P29
**来源**: Claude Code `hash.ts`
**适用场景**: 内容hash、缓存key生成

---

## 概述

Hash Utils提供快速非加密hash函数。djb2 hash用于缓存key，hashContent用于内容变化检测。支持Bun.hash（快）和SHA-256（兼容）。

---

## 核心功能

### 1. djb2 Hash

```typescript
/**
 * djb2 string hash — fast non-cryptographic hash
 * 返回signed 32-bit int
 */
export function djb2Hash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return hash
}
```

### 2. Content Hash

```typescript
/**
 * Hash arbitrary content for change detection
 * Bun.hash ~100x faster than sha256
 */
export function hashContent(content: string): string {
  if (typeof Bun !== 'undefined') {
    return Bun.hash(content).toString()
  }
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(content).digest('hex')
}
```

### 3. Pair Hash

```typescript
/**
 * Hash two strings without concatenating
 * Bun: seed-chain wyhash
 * Node: incremental SHA-256 update
 */
export function hashPair(a: string, b: string): string {
  if (typeof Bun !== 'undefined') {
    return Bun.hash(b, Bun.hash(a)).toString()
  }
  return crypto.createHash('sha256')
    .update(a)
    .update('\0')
    .update(b)
    .digest('hex')
}
```

---

## OpenClaw应用

### 1. 缓存Key

```typescript
// 飞书消息缓存key
const cacheKey = djb2Hash(messageId).toString(16)

// 文件内容变化检测
const contentHash = hashContent(fileContent)
if (contentHash !== cachedHash) {
  // 内容变化，重新处理
}
```

### 2. 会话ID

```typescript
// 会话ID生成
const sessionId = hashPair(userId, timestamp).slice(0, 16)
```

---

## 状态文件

```json
{
  "skill": "hash-utils",
  "priority": "P29",
  "source": "hash.ts",
  "enabled": true,
  "hashTypes": ["djb2", "content", "pair"],
  "hashesGenerated": 0,
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `hash.ts`
- djb2 hash algorithm