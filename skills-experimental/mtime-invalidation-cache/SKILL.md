# mtime Invalidation Cache Skill

mtime Invalidation Cache - FileReadCache + mtime invalidation + stats.statSync + cache key + maxCacheSize eviction + oldest entry removal + invalidate method + singleton export + encoding detection + readFile with cache。

## 功能概述

从Claude Code的utils/fileReadCache.ts提取的mtime invalidation cache模式，用于OpenClaw的文件读取缓存。

## 核心机制

### FileReadCache Class

```typescript
class FileReadCache {
  private cache = new Map<string, CachedFileData>()
  private readonly maxCacheSize = 1000
  // Max 1000 cached files
  // Map for cache storage
}
```

### mtime Invalidation

```typescript
// Get file stats for cache invalidation
const stats = fs.statSync(filePath)
// ...
if (cachedData && cachedData.mtime === stats.mtimeMs) {
  // Cache hit: mtime unchanged
  return cachedData
}
// mtime: file modification time in milliseconds
# mtime unchanged → cache valid
```

### stats.statSync

```typescript
const stats = fs.statSync(filePath)
// Get file stats synchronously
// throws on file deleted
# mtimeMs: modification time in ms
```

### cacheKey

```typescript
const cacheKey = filePath
// Cache key: file path (simple, no complex key)
# filePath as key
# No multi-field key
```

### maxCacheSize Eviction

```typescript
private readonly maxCacheSize = 1000
// Evict oldest entries if cache is too large
if (this.cache.size > this.maxCacheSize) {
  const firstKey = this.cache.keys().next().value
  if (firstKey) {
    this.cache.delete(firstKey)  // Delete oldest (first inserted)
  }
}
// LRU-like eviction
# Map.keys().next().value = oldest
```

### oldest Entry Removal

```typescript
this.cache.keys().next().value  // First key = oldest entry
// Map maintains insertion order
# First key = oldest
# Delete oldest on overflow
```

### invalidate Method

```typescript
invalidate(filePath: string): void {
  this.cache.delete(filePath)
}
// Remove specific file from cache
# Manual invalidation
```

### Singleton Export

```typescript
// Export a singleton instance
export const fileReadCache = new FileReadCache()
// Singleton pattern
# Global instance
# Shared cache
```

### encoding Detection

```typescript
const encoding = detectFileEncoding(filePath)
// Detect file encoding before read
# Correct encoding for content
```

### readFile with Cache

```typescript
readFile(filePath: string): { content: string; encoding: BufferEncoding }
// Returns both content and encoding
// Cache includes encoding
# Encoding preserved in cache
```

### File Deleted Handling

```typescript
try {
  stats = fs.statSync(filePath)
} catch (error) {
  // File was deleted, remove from cache and re-throw
  this.cache.delete(filePath)
  throw error
}
// File deleted → remove from cache
# Self-cleaning
```

## 实现建议

### OpenClaw适配

1. **mtimeInvalidation**: mtime invalidation pattern
2. **maxCacheSize**: maxCacheSize eviction pattern
3. **oldestRemoval**: oldest entry removal pattern
4. **singletonExport**: Singleton export pattern
5. **fileDeletedHandling**: File deleted handling

### 状态文件示例

```json
{
  "cacheSize": 50,
  "maxCacheSize": 1000,
  "cachedFiles": ["file1.ts", "file2.ts"]
}
```

## 关键模式

### mtime-Based Invalidation

```
statSync(filePath).mtimeMs === cached.mtime → valid | ≠ → stale → re-read
# mtime作为invalidation依据
# mtime不变cache valid
# mtime变化re-read
```

### Map Insertion Order LRU

```
Map.keys().next().value → first inserted → oldest → delete on overflow → LRU-like
# Map保持insertion order
# 第一个key是最old
# overflow时删除oldest
# 类似LRU
```

### Singleton Shared Cache

```
new FileReadCache() → singleton → shared across modules → one cache instance
# singleton instance
# 跨modules共享
# 单一cache instance
```

### File Deleted Self-Cleaning

```
statSync throws → file deleted → cache.delete(filePath) → remove stale → re-throw
# statSync抛异常=文件删除
# cache.delete移除stale
# self-cleaning
```

### Encoding Preserved in Cache

```
detectFileEncoding(filePath) → encoding → cached with content → encoding preserved
# encoding detection
# cached with content
# encoding preserved
```

## 借用价值

- ⭐⭐⭐⭐⭐ mtime invalidation pattern
- ⭐⭐⭐⭐⭐ Map insertion order LRU eviction
- ⭐⭐⭐⭐⭐ Singleton shared cache pattern
- ⭐⭐⭐⭐⭐ File deleted self-cleaning
- ⭐⭐⭐⭐ maxCacheSize limit pattern

## 来源

- Claude Code: `utils/fileReadCache.ts` (96 lines)
- 分析报告: P53-1