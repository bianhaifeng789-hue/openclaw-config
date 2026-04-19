# Memoize Custom Resolver Pattern Skill

Memoize Custom Resolver Pattern - lodash-es/memoize + custom resolver function + first arg default + multi-arg key + ignore abortSignal + ignore shouldLogError + countFilesRoundedRg memoize + ripGrepFileCount memoize + getRipgrepConfig memoize + testRipgrepOnFirstUse memoize + parseJSONCached memoize。

## 功能概述

从Claude Code多个文件提取的Memoize custom resolver模式，用于OpenClaw的函数缓存。

## 核心机制

### lodash-es/memoize

```typescript
import memoize from 'lodash-es/memoize.js'

const getRipgrepConfig = memoize((): RipgrepConfig => { ... })
// lodash-es/memoize
# Function memoization
# Cache results
# Default resolver = first arg
```

### custom resolver function

```typescript
memoize(fn, resolver)
// resolver: function that returns cache key
# Custom cache key
# Override default
```

### first arg default

```typescript
// lodash memoize's default resolver only uses the first argument
memoize(fn)  // Default: resolver = first arg
// First arg default
# Default resolver
# args[0] as key
```

### multi-arg key

```typescript
// lodash memoize's default resolver only uses the first argument.
// ignorePatterns affect the result, so include them in the cache key.
// abortSignal is intentionally excluded — it doesn't affect the count.
(dirPath, _abortSignal, ignorePatterns = []) => `${dirPath}|${ignorePatterns.join(',')}`
// Multi-arg key
# Include relevant args
# Exclude irrelevant
```

### ignore abortSignal

```typescript
// abortSignal is intentionally excluded — it doesn't affect the count
(dirPath, _abortSignal, ignorePatterns = []) => ...
// Ignore abortSignal
# Doesn't affect result
# Not part of key
```

### ignore shouldLogError

```typescript
// Note: shouldLogError is intentionally excluded from the cache key (matching
// lodash memoize default resolver = first arg only).
memoizeWithLRU(parseJSONUncached, json => json, 50)  // Only json as key
// Ignore shouldLogError
# Not in cache key
# Only json string
```

### countFilesRoundedRg memoize

```typescript
export const countFilesRoundedRg = memoize(
  async (dirPath: string, abortSignal: AbortSignal, ignorePatterns: string[] = []): Promise<number | undefined> => { ... },
  (dirPath, _abortSignal, ignorePatterns = []) => `${dirPath}|${ignorePatterns.join(',')}`,
)
// countFilesRoundedRg memoize
# Multi-arg resolver
# abortSignal excluded
```

### ripGrepFileCount memoize

```typescript
// Not memoized but uses similar pattern
// (actually not shown in excerpt)
// Pattern similar to other memoize calls
```

### getRipgrepConfig memoize

```typescript
const getRipgrepConfig = memoize((): RipgrepConfig => { ... })
// getRipgrepConfig memoize
# No args → singleton
# Cache forever
```

### testRipgrepOnFirstUse memoize

```typescript
const testRipgrepOnFirstUse = memoize(async (): Promise<void> => { ... })
// testRipgrepOnFirstUse memoize
# No args → singleton
# Test once
```

### parseJSONCached memoize

```typescript
const parseJSONCached = memoizeWithLRU(parseJSONUncached, json => json, 50)
// parseJSONCached memoize
# LRU bounded
# Only json as key
```

## 实现建议

### OpenClaw适配

1. **memoizeResolver**: Custom resolver function pattern
2. **multiArgKey**: Multi-arg key pattern
3. **ignoreIrrelevant**: ignore abortSignal/shouldLogError pattern
4. **singletonMemoize**: No args singleton pattern
5. **lruMemoize**: memoizeWithLRU bounded pattern

### 状态文件示例

```json
{
  "cacheKey": "/home/user/project|*.log,*.tmp",
  "cached": true,
  "resolver": "multi-arg"
}
```

## 关键模式

### Custom Resolver Override Default

```
memoize(fn, resolver) → resolver overrides → first arg default → custom key
# custom resolver override
# lodash default = first arg
# override with custom
```

### Multi-Arg Key Join

```
(dirPath, _, ignorePatterns) => `${dirPath}|${ignorePatterns.join(',')}` → join → multi-arg key
# multi-arg key join
# separator '|'
# array join(',')
```

### Exclude Irrelevant Args

```
abortSignal excluded → doesn't affect result | shouldLogError excluded → not in key → exclude irrelevant
# exclude irrelevant args
# abortSignal不影响result
# shouldLogError not in key
```

### No Args Singleton Memoize

```
memoize(() => {...}) → no args → singleton → cache forever → one-time computation
# no args singleton
# cache forever
# one-time computation
```

### LRU Bounded vs Unbounded

```
memoizeWithLRU(fn, resolver, 50) → bounded | memoize(fn) → unbounded → bounded vs unbounded
# LRU bounded vs unbounded
# 50 entries vs forever
# prevent memory leak
```

## 借用价值

- ⭐⭐⭐⭐⭐ Custom resolver override pattern
- ⭐⭐⭐⭐⭐ Multi-arg key join pattern
- ⭐⭐⭐⭐⭐ Exclude irrelevant args pattern
- ⭐⭐⭐⭐⭐ No args singleton pattern
- ⭐⭐⭐⭐⭐ LRU bounded vs unbounded pattern

## 来源

- Claude Code: `utils/ripgrep.ts` (698 lines), `utils/json.ts` (327 lines)
- 分析报告: P57-6