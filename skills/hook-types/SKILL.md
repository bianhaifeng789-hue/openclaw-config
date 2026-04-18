# Hook Types Skill

Hook类型系统 - Discriminated hook output + Zod validation + Event-specific output + Async/Sync type guard。

## 功能概述

从Claude Code的Hook Types提取的hook类型模式，用于OpenClaw的hook系统。

## 核心机制

### Discriminated Hook Output

```typescript
hookSpecificOutput: z.union([
  z.object({ hookEventName: z.literal('PreToolUse'), permissionDecision, updatedInput }),
  z.object({ hookEventName: z.literal('UserPromptSubmit'), additionalContext }),
  z.object({ hookEventName: z.literal('SessionStart'), initialUserMessage, watchPaths }),
  z.object({ hookEventName: z.literal('PostToolUse'), updatedMCPToolOutput }),
  z.object({ hookEventName: z.literal('PermissionRequest'), decision }),
  // ... more event types
])
// hookEventName作为discriminator
// Event-specific output shape
```

### Async/Sync Type Guard

```typescript
export function isSyncHookJSONOutput(json: HookJSONOutput): json is SyncHookJSONOutput {
  return !('async' in json && json.async === true)
}
export function isAsyncHookJSONOutput(json: HookJSONOutput): json is AsyncHookJSONOutput {
  return 'async' in json && json.async === true
}
// Type guard for async/sync
// Compile-time narrowing
```

### Zod Validation

```typescript
export const syncHookResponseSchema = lazySchema(() =>
  z.object({
    continue: z.boolean().optional(),
    suppressOutput: z.boolean().optional(),
    stopReason: z.string().optional(),
    decision: z.enum(['approve', 'block']).optional(),
    hookSpecificOutput: z.union([...]).optional()
  })
)

export const hookJSONOutputSchema = lazySchema(() =>
  z.union([asyncHookResponseSchema, syncHookResponseSchema()])
)
// Lazy schema for validation
// Union for async/sync
```

### Event-Specific Output

```typescript
z.object({
  hookEventName: z.literal('SessionStart'),
  additionalContext: z.string().optional(),
  initialUserMessage: z.string().optional(),
  watchPaths: z.array(z.string()).optional()
})
// SessionStart → initial message + watch paths
// 每个event有unique shape
```

### PermissionRequest Decision

```typescript
z.object({
  hookEventName: z.literal('PermissionRequest'),
  decision: z.union([
    z.object({ behavior: z.literal('allow'), updatedInput, updatedPermissions }),
    z.object({ behavior: z.literal('deny'), message, interrupt })
  ])
})
// PermissionRequest → allow/deny decision
// Structured permission result
```

### Prompt Elicitation

```typescript
export type PromptRequest = {
  prompt: z.string()  // request id
  message: z.string()
  options: z.array({ key, label, description })
}

export type PromptResponse = {
  prompt_response: string  // request id
  selected: string
}
// prompt key as discriminator
// Elicitation protocol
```

### Hook Result Aggregation

```typescript
export type AggregatedHookResult = {
  message?: Message
  blockingErrors?: HookBlockingError[]
  preventContinuation?: boolean
  additionalContexts?: string[]
  permissionRequestResult?: PermissionRequestResult
}
// Multiple hooks → aggregated result
// 防止多个blockingError
```

## 实现建议

### OpenClaw适配

1. **discriminatedOutput**: Discriminated hook output
2. **asyncSyncGuard**: Async/Sync type guard
3. **zodValidation**: Zod validation
4. **eventSpecific**: Event-specific output

### 状态文件示例

```json
{
  "hookEventName": "PreToolUse",
  "permissionDecision": "allow",
  "updatedInput": {...},
  "async": false
}
```

## 关键模式

### Discriminated Union by Event

```
hookEventName: z.literal('PreToolUse') → unique shape
// 每个event unique output
// 编译时类型安全
```

### Async/Sync Type Guard

```
isSyncHookJSONOutput / isAsyncHookJSONOutput
// 区分async/sync
// Type narrowing
```

### Lazy Schema Pattern

```
lazySchema(() => z.union([...]))
// 避免循环dependency
// 按需validate
```

### PermissionRequest Allow/Deny

```
decision: z.union([allow, deny])
// 结构化permission decision
// Hook可override permission
```

## 借用价值

- ⭐⭐⭐⭐⭐ Discriminated hook output
- ⭐⭐⭐⭐⭐ Async/Sync type guard
- ⭐⭐⭐⭐⭐ Event-specific shape
- ⭐⭐⭐⭐ PermissionRequest decision
- ⭐⭐⭐⭐ Prompt elicitation protocol

## 来源

- Claude Code: `types/hooks.ts`
- 分析报告: P39-4