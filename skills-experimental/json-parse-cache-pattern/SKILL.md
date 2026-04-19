# JSON Parse Cache Pattern Skill

JSON Parse Cache Pattern - safeParseJSON + memoizeWithLRU 50 entries + PARSE_CACHE_MAX_KEY_BYTES 8KB skip + discriminated-union CachedParse + ok:true/false wrapper + JSON.parse("null") null handling + invalid JSON cache (behavioral regression) + shouldLogError excluded from key + Bun.JSONL.parseChunk + parseJSONL indexOf + readJSONLFile 100MB tail + skip first partial line。

## 功能概述

从Claude Code的utils/json.ts提取的JSON parse cache模式，用于OpenClaw的JSON解析。

## 核心机制

### safeParseJSON

```typescript
export const safeParseJSON = Object.assign(
  function safeParseJSON(json: string | null | undefined, shouldLogError: boolean = true): unknown {
    if (!json) return null
    const result =
      json.length > PARSE_CACHE_MAX_KEY_BYTES
        ? parseJSONUncached(json, shouldLogError)
        : parseJSONCached(json, shouldLogError)
    return result.ok ? result.value : null
  },
  { cache: parseJSONCached.cache },
)
// Safe parse JSON
# LRU-bounded 50 entries
# Skip large inputs >8KB
# Return null on error
```

### memoizeWithLRU 50 entries

```typescript
const parseJSONCached = memoizeWithLRU(parseJSONUncached, json => json, 50)
// LRU-bounded cache
# 50 entries max
# Prevent memory leak
# lodash memoize cached forever
```

### PARSE_CACHE_MAX_KEY_BYTES 8KB skip

```typescript
const PARSE_CACHE_MAX_KEY_BYTES = 8 * 1024
// Skip caching above 8KB
# LRU stores full string as key
# 200KB config → ~10MB in #keyList
# Large inputs change between reads
```

### discriminated-union CachedParse

```typescript
type CachedParse = { ok: true; value: unknown } | { ok: false }
// Discriminated-union wrapper
# ok: true → valid parse
# ok: false → invalid JSON
# Both cases cached
```

### ok:true/false wrapper

```typescript
function parseJSONUncached(json: string, shouldLogError: boolean): CachedParse {
  try {
    return { ok: true, value: JSON.parse(stripBOM(json)) }
  } catch (e) {
    if (shouldLogError) logError(e)
    return { ok: false }
  }
}
// ok:true/false wrapper
# {ok: true, value} | {ok: false}
# Discriminated union
```

### JSON.parse("null") null handling

```typescript
// Memoized inner parse. Uses a discriminated-union wrapper because:
// 1. memoizeWithLRU requires NonNullable<unknown>, but JSON.parse can return
//    null (e.g. JSON.parse("null")).
// 2. Invalid JSON must also be cached — otherwise repeated calls re-parse
// null handling
# JSON.parse("null") → null
# NonNullable constraint
# Wrapper avoids null
```

### invalid JSON cache (behavioral regression)

```typescript
// Invalid JSON must also be cached — otherwise repeated calls with the same
// bad string re-parse and re-log every time (behavioral regression vs the
// old lodash memoize which wrapped the entire try/catch).
// Cache invalid JSON
# ok: false cached
# Avoid re-parse + re-log
# Behavioral regression
```

### shouldLogError excluded from key

```typescript
// Note: shouldLogError is intentionally excluded from the cache key (matching
// lodash memoize default resolver = first arg only).
// shouldLogError excluded
# Only first arg in key
# Cache key: json string
```

### Bun.JSONL.parseChunk

```typescript
const bunJSONLParse: BunJSONLParseChunk | false = (() => {
  if (typeof Bun === 'undefined') return false
  const b = Bun as Record<string, unknown>
  const jsonl = b.JSONL as Record<string, unknown> | undefined
  if (!jsonl?.parseChunk) return false
  return jsonl.parseChunk as BunJSONLParseChunk
})()
// Bun.JSONL.parseChunk
# Zero-cost native
# Fast JSONL parse
# Fallback to indexOf
```

### parseJSONL indexOf

```typescript
function parseJSONLBuffer<T>(buf: Buffer): T[] {
  let start = 0
  const results: T[] = []
  while (start < bufLen) {
    let end = buf.indexOf(0x0a, start)  // '\n'
    if (end === -1) end = bufLen
    const line = buf.toString('utf8', start, end).trim()
    start = end + 1
    if (!line) continue
    try {
      results.push(JSON.parse(line) as T)
    } catch {
      // Skip malformed lines
    }
  }
  return results
}
// parseJSONL indexOf
# indexOf(0x0a) → '\n'
# Skip malformed lines
# Buffer toString
```

### readJSONLFile 100MB tail

```typescript
const MAX_JSONL_READ_BYTES = 100 * 1024 * 1024
export async function readJSONLFile<T>(filePath: string): Promise<T[]> {
  const { size } = await stat(filePath)
  if (size <= MAX_JSONL_READ_BYTES) {
    return parseJSONL<T>(await readFile(filePath))
  }
  // Read tail for large files
  // ...
}
// 100MB tail read
# Large files: read last 100MB
# Skip first partial line
```

### skip first partial line

```typescript
const buf = Buffer.allocUnsafe(MAX_JSONL_READ_BYTES)
// Read tail
const newlineIndex = buf.indexOf(0x0a)
if (newlineIndex !== -1 && newlineIndex < totalRead - 1) {
  return parseJSONL<T>(buf.subarray(newlineIndex + 1, totalRead))
}
// Skip first partial line
# indexOf('\n') → skip
# subarray after first newline
# Avoid torn line
```

## 实现建议

### OpenClaw适配

1. **jsonParseCache**: safeParseJSON + LRU cache pattern
2. **discriminatedUnion**: ok:true/false wrapper pattern
3. **invalidJsonCache**: Invalid JSON cache pattern
4. **parseJSONLIndexOf**: parseJSONL indexOf pattern
5. **readJSONLTail**: readJSONLFile 100MB tail pattern

### 状态文件示例

```json
{
  "cacheSize": 50,
  "maxKeyBytes": 8192,
  "parseResult": {"ok": true, "value": {...}}
}
```

## 关键模式

### discriminated-union Cache Wrapper

```
{ok: true, value} | {ok: false} → discriminated union → null handling → NonNullable constraint
# discriminated-union wrapper
# null handling
# NonNullable constraint
```

### Invalid JSON Must Cache

```
ok: false cached → avoid re-parse + re-log → behavioral regression → lodash memoize wrapped try/catch
# invalid JSON must cache
# avoid re-parse re-log
# behavioral regression fix
```

### shouldLogError Excluded from Key

```
shouldLogError excluded → cache key = first arg only → lodash default resolver → only json string
# shouldLogError excluded from key
# cache key = json string only
```

### Bun.JSONL.parseChunk Zero-Cost

```
typeof Bun !== 'undefined' → Bun.JSONL.parseChunk → zero-cost native → else → indexOf fallback
# Bun.JSONL.parseChunk zero-cost
# native fast parse
# indexOf fallback
```

### 100MB Tail + Skip Partial

```
size > 100MB → read tail → indexOf('\n') → skip first partial → subarray → avoid torn line
# 100MB tail + skip partial
# skip first partial line
# avoid torn line
```

## 借用价值

- ⭐⭐⭐⭐⭐ discriminated-union cache wrapper pattern
- ⭐⭐⭐⭐⭐ Invalid JSON must cache pattern
- ⭐⭐⭐⭐⭐ shouldLogError excluded from key pattern
- ⭐⭐⭐⭐⭐ Bun.JSONL.parseChunk zero-cost pattern
- ⭐⭐⭐⭐⭐ 100MB tail + skip partial pattern

## 来源

- Claude Code: `utils/json.ts` (327 lines)
- 分析报告: P57-3