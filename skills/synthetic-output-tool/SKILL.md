# Synthetic Output Tool Skill

结构化输出工具 - Identity cache + Ajv validation + Schema compile + Passthrough input。

## 功能概述

从Claude Code的SyntheticOutputTool提取的结构化输出模式，用于OpenClaw的非交互式SDK输出。

## 核心机制

### Identity Cache (WeakMap)

```typescript
const toolCache = new WeakMap<object, CreateResult>()
export function createSyntheticOutputTool(jsonSchema: Record<string, unknown>): CreateResult {
  const cached = toolCache.get(jsonSchema)
  if (cached) return cached
  const result = buildSyntheticOutputTool(jsonSchema)
  toolCache.set(jsonSchema, result)
  return result
}
// WeakMap by schema object reference
// Workflow scripts call 30-80 times with same schema
// 80-call: ~110ms → ~4ms Ajv overhead
```

### Ajv Validation + Compile

```typescript
const ajv = new Ajv({ allErrors: true })
const isValidSchema = ajv.validateSchema(jsonSchema)
if (!isValidSchema) return { error: ajv.errorsText(ajv.errors) }
const validateSchema = ajv.compile(jsonSchema)
// validateSchema first
// then compile for fast validation
```

### Passthrough Input Schema

```typescript
const inputSchema = lazySchema(() => z.object({}).passthrough())
// Allow any input object
// Schema provided dynamically
// 不限制input shape
```

### Schema Validation in Call

```typescript
async call(input) {
  const isValid = validateSchema(input)
  if (!isValid) {
    const errors = validateSchema.errors?.map(e => `${e.instancePath || 'root'}: ${e.message}`).join(', ')
    throw new TelemetrySafeError(`Output does not match required schema: ${errors}`)
  }
  return { data: 'Structured output provided successfully', structured_output: input }
}
// compile后的validator
// fast path validation
```

### Non-Interactive Only

```typescript
export function isSyntheticOutputToolEnabled(opts: { isNonInteractiveSession: boolean }): boolean {
  return opts.isNonInteractiveSession
}
// 只有非交互式session启用
// SDK/CLI use
```

### Error Result Pattern

```typescript
type CreateResult = { tool: Tool<InputSchema> } | { error: string }
// 成功返回tool
// 失败返回error string
// 不throw exception
```

### Minimal UI

```typescript
renderToolUseMessage(input: Record<string, unknown>) {
  const keys = Object.keys(input)
  if (keys.length <= 3) return keys.map(k => `${k}: ${jsonStringify(input[k])}`).join(', ')
  return `${keys.length} fields: ${keys.slice(0, 3).join(', ')}…`
}
// Non-interactive → minimal UI
// 只显示摘要
```

## 实现建议

### OpenClaw适配

1. **identityCache**: Identity cache (WeakMap)
2. **ajvValidation**: Ajv validation
3. **passthroughInput**: Passthrough input
4. **errorResult**: Error result pattern

### 状态文件示例

```json
{
  "schemaValid": true,
  "inputValid": true,
  "cached": true,
  "fields": 5,
  "nonInteractive": true
}
```

## 关键模式

### Identity WeakMap Cache

```
WeakMap by object reference → same schema → cached tool
// 不用JSON.stringify做key
// Object identity
// 80x calls → 27x faster
```

### Ajv Two-Phase

```
validateSchema() → compile() → fast validator
// 先验证schema本身
// 再compile for speed
```

### Passthrough Schema

```
z.object({}).passthrough() → allow any fields
// 动态schema
// Tool不限制shape
```

### Error Result Not Throw

```
return { error: string } → not throw
// 让caller决定处理
// 不用try-catch
```

## 借用价值

- ⭐⭐⭐⭐⭐ Identity WeakMap cache
- ⭐⭐⭐⭐⭐ Ajv two-phase validation
- ⭐⭐⭐⭐⭐ Passthrough input schema
- ⭐⭐⭐⭐ Error result pattern

## 来源

- Claude Code: `tools/SyntheticOutputTool/SyntheticOutputTool.ts` (6KB+)
- 分析报告: P38-32