# Zod JSON Schema Skill

**优先级**: P31
**来源**: Claude Code `zodToJsonSchema.ts`
**适用场景**: WeakMap缓存模式、高效转换

---

## 概述

Zod JSON Schema将Zod v4 schema转换为JSON Schema，使用WeakMap缓存。相同ZodTypeAny reference返回相同结果，避免重复转换（60-250次/turn）。

---

## 核心功能

### 1. WeakMap缓存

```typescript
type CachedSchema = BetaTool & {
  strict?: boolean
  eager_input_streaming?: boolean
}

const cache = new WeakMap<ZodTypeAny, JsonSchema7Type>()

export function zodToJsonSchema(schema: ZodTypeAny): JsonSchema7Type {
  const hit = cache.get(schema)
  if (hit) return hit
  
  const result = toJSONSchema(schema) as JsonSchema7Type
  cache.set(schema, result)
  return result
}
```

### 2. Key特性

- **WeakMap**: 不阻止GC，当schema对象被释放时自动清理
- **Identity-based**: 相同reference → 相同缓存
- **No serialization**: 不需要key字符串化

---

## OpenClaw应用

### 1. Tool Schema缓存

```typescript
// Tool schema转换缓存
const schemaCache = new WeakMap<ZodTypeAny, object>()

export function getToolSchema(zodSchema: ZodTypeAny): object {
  const cached = schemaCache.get(zodSchema)
  if (cached) return cached
  
  const jsonSchema = zodToJsonSchema(zodSchema)
  schemaCache.set(zodSchema, jsonSchema)
  return jsonSchema
}
```

---

## 状态文件

```json
{
  "skill": "zod-json-schema",
  "priority": "P31",
  "source": "zodToJsonSchema.ts",
  "enabled": true,
  "cacheType": "WeakMap",
  "identityBased": true,
  "createdAt": "2026-04-12T13:50:00Z"
}
```

---

## 参考

- Claude Code: `zodToJsonSchema.ts`