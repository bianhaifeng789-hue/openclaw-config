---
name: file-read-cache
description: "In-memory file content cache with mtime-based invalidation. 1000 entries max. Encoding detection. Cache statistics. Reduce redundant reads. Use when [file read cache] is needed."
metadata:
  openclaw:
    emoji: "📄"
    triggers: [file-edit, file-read]
    feishuCard: true
---

# File Read Cache Skill - 文件读取缓存

mtime-based 文件内容缓存，减少重复读取。

## 为什么需要这个？

**场景**：
- FileEditTool 重复读取
- 减少 IO 操作
- 自动 invalidation
- Cache stats 监控

**Claude Code 方案**：fileReadCache.ts + mtime
**OpenClaw 飞书适配**：文件缓存 + mtime invalidation

---

## Cache 结构

```typescript
type CachedFileData = {
  content: string
  encoding: BufferEncoding
  mtime: number
}

class FileReadCache {
  private cache = new Map<string, CachedFileData>()
  private readonly maxCacheSize = 1000
  
  readFile(filePath: string): { content: string; encoding: BufferEncoding }
  clear(): void
  invalidate(filePath: string): void
  getStats(): { size: number; entries: string[] }
}
```

---

## 缓存流程

### 1. Read with Cache

```typescript
function readFile(filePath: string): { content: string; encoding: BufferEncoding } {
  const fs = getFsImplementation()
  
  // Get file stats
  const stats = fs.statSync(filePath)
  const mtime = stats.mtimeMs
  
  // Check cache
  const cachedData = cache.get(filePath)
  
  if (cachedData && cachedData.mtime === mtime) {
    // Cache hit - return cached
    return { content: cachedData.content, encoding: cachedData.encoding }
  }
  
  // Cache miss - read file
  const encoding = detectFileEncoding(filePath)
  const content = fs.readFileSync(filePath, { encoding })
  
  // Update cache
  cache.set(filePath, { content, encoding, mtime })
  
  // Evict if too large
  if (cache.size > maxCacheSize) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  
  return { content, encoding }
}
```

---

## 飞书卡片格式

### Cache Statistics 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📄 File Read Cache Statistics**\n\n---\n\n**缓存信息**：\n\n| 属性 | 值 |\n|------|------|\n| **缓存大小** | 250 entries |\n| **最大容量** | 1000 entries |\n| **命中率** | 85% |\n\n---\n\n**缓存文件**：\n• MEMORY.md ✓\n• USER.md ✓\n• HEARTBEAT.md ✓\n• ...（共 250 个）\n\n---\n\n**性能提升**：\n• IO 减少：85%\n• 平均读取时间：0.5ms → 0.01ms"
      }
    }
  ]
}
```

---

## 执行流程

### 1. Cache Hit/Miss

```
File Read Cache:
1. 获取 file stats（mtime）
2. 检查 cache（key = filePath）
3. mtime 匹配 → hit，返回 cached
4. mtime 不匹配 → miss，读取文件
5. 更新 cache
6. 超过容量 → evict oldest
```

### 2. Invalidation

```typescript
function invalidate(filePath: string): void {
  cache.delete(filePath)
}

function clear(): void {
  cache.clear()
}
```

---

## 持久化存储

```json
// memory/file-read-cache-state.json
{
  "stats": {
    "totalReads": 0,
    "cacheHits": 0,
    "cacheMisses": 0,
    "hitRate": 0
  },
  "config": {
    "maxCacheSize": 1000
  },
  "current": {
    "size": 0,
    "entries": []
  },
  "lastUpdate": "2026-04-12T00:18:00Z",
  "notes": "File Read Cache Skill 创建完成。等待 file-edit 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| fileReadCache.ts | Skill + 状态文件 |
| mtime-based | 同样 mtime |
| maxCacheSize 1000 | 同样 1000 |
| encoding detection | 同样 encoding |

---

## 注意事项

1. **mtime-based**：基于修改时间 invalidation
2. **Max size**：1000 entries
3. **Encoding**：自动检测 encoding
4. **Eviction**：LRU eviction（oldest first）
5. **Stats**：命中率监控

---

## 自动启用

此 Skill 在 FileEditTool 操作时自动使用。

---

## 下一步增强

- Hit rate analytics
- Eviction策略优化
- Pre-fetch common files