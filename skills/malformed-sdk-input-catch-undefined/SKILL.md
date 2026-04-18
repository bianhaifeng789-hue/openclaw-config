# Malformed SDK Input Catch Undefined Skill

Malformed SDK Input Catch Undefined - lazySchema .catch(undefined) + decisionClassification catch undefined + updatedPermissions catch undefined + malformed entries ignored + SDK hosts may send bad values + logForDebugging warn + permissionPromptToolResultToPermissionDecision normalization + empty object {} mobile use original + interrupt abortController signal。

## 功能概述

从Claude Code的utils/permissions/PermissionPromptToolResultSchema.ts提取的Malformed SDK input catch undefined模式，用于OpenClaw的SDK输入容错处理。

## 核心机制

### lazySchema .catch(undefined)

```typescript
const PermissionAllowResultSchema = lazySchema(() =>
  z.object({
    behavior: z.literal('allow'),
    updatedInput: z.record(z.string(), z.unknown()),
    updatedPermissions: z
      .array(permissionUpdateSchema())
      .optional()
      .catch(ctx => {
        logForDebugging(
          `Malformed updatedPermissions from SDK host ignored: ${ctx.error.issues[0]?.message ?? 'unknown'}`,
          { level: 'warn' },
        )
        return undefined
      }),
    toolUseID: z.string().optional(),
    decisionClassification: decisionClassificationField(),
  }),
)
// .catch(undefined)
# Malformed → undefined
# Don't reject whole decision
# Log warning
```

### decisionClassification catch undefined

```typescript
// Matches PermissionDecisionClassificationSchema in entrypoints/sdk/coreSchemas.ts.
// Malformed values fall through to undefined (same pattern as updatedPermissions
// below) so a bad string from the SDK host doesn't reject the whole decision.
const decisionClassificationField = lazySchema(() =>
  z
    .enum(['user_temporary', 'user_permanent', 'user_reject'])
    .optional()
    .catch(undefined),
)
// decisionClassification catch
# Bad string → undefined
# Don't reject decision
# Fall through to undefined
```

### updatedPermissions catch undefined

```typescript
updatedPermissions: z
  .array(permissionUpdateSchema())
  .optional()
  .catch(ctx => {
    logForDebugging(
      `Malformed updatedPermissions from SDK host ignored: ${ctx.error.issues[0]?.message ?? 'unknown'}`,
      { level: 'warn' },
    )
    return undefined
  }),
// updatedPermissions catch
# Malformed array → undefined
# Ignore bad entries
# Log warning
```

### malformed entries ignored

```typescript
// SDK hosts may send malformed entries; fall back to undefined rather
// than rejecting the entire allow decision (anthropics/claude-code#29440)
// malformed entries ignored
# Don't reject whole decision
# Graceful degradation
# Continue with partial data
```

### SDK hosts may send bad values

```typescript
// SDK hosts may send malformed entries
// anthropics/claude-code#29440
// External SDK clients may not have proper validation
// SDK hosts bad values
# External client issues
# Version mismatch
# Different schema versions
```

### logForDebugging warn

```typescript
logForDebugging(
  `Malformed updatedPermissions from SDK host ignored: ${ctx.error.issues[0]?.message ?? 'unknown'}`,
  { level: 'warn' },
)
// logForDebugging warn
# Log malformed data
# Debug trace
# Not crash
```

### permissionPromptToolResultToPermissionDecision normalization

```typescript
export function permissionPromptToolResultToPermissionDecision(
  result: Output,
  tool: Tool,
  input: { [key: string]: unknown },
  toolUseContext: ToolUseContext,
): PermissionDecision {
  const decisionReason: PermissionDecisionReason = {
    type: 'permissionPromptTool',
    permissionPromptToolName: tool.name,
    toolResult: result,
  }
  
  if (result.behavior === 'allow') {
    const updatedPermissions = result.updatedPermissions
    if (updatedPermissions) {
      toolUseContext.setAppState(prev => ({
        ...prev,
        toolPermissionContext: applyPermissionUpdates(
          prev.toolPermissionContext,
          updatedPermissions,
        ),
      }))
      persistPermissionUpdates(updatedPermissions)
    }
    // ...
  }
  // ...
}
// normalization
# Apply updatedPermissions
# Persist to disk
# Update AppState
```

### empty object {} mobile use original

```typescript
// Mobile clients responding from a push notification don't have the
// original tool input, so they send `{}` to satisfy the schema. Treat an
// empty object as "use original" so the tool doesn't run with no args.
const updatedInput =
  Object.keys(result.updatedInput).length > 0 ? result.updatedInput : input
// empty object {} mobile
# {} → use original input
# Mobile push notification
# Don't run with no args
```

### interrupt abortController signal

```typescript
if (result.behavior === 'deny' && result.interrupt) {
  logForDebugging(
    `SDK permission prompt deny+interrupt: tool=${tool.name} message=${result.message}`,
  )
  toolUseContext.abortController.abort()
}
// interrupt abortController
# deny + interrupt
# Abort current operation
# Cancel execution
```

## 实现建议

### OpenClaw适配

1. **catchUndefined**: .catch(undefined) pattern
2. **malformedIgnore**: malformed entries ignored pattern
3. **sdkTolerance**: SDK hosts bad values tolerance pattern
4. **emptyUseOriginal**: {} → use original pattern
5. **interruptAbort**: deny + interrupt pattern

### 状态文件示例

```json
{
  "behavior": "allow",
  "updatedInput": {},
  "updatedPermissions": null,
  "decisionClassification": null,
  "malformed": true
}
```

## 关键模式

### .catch(undefined) Graceful Degradation

```
z.enum([...]).optional().catch(undefined) → malformed → undefined → don't reject → graceful degradation
# .catch(undefined) graceful degradation
# bad value → undefined
# continue with partial data
```

### SDK Hosts Malformed Entries

```
SDK hosts may send malformed entries → external clients → version mismatch → catch undefined → ignore bad values
# SDK hosts malformed entries
# external client issues
# graceful handling
```

### {} Empty Object Use Original

```
Object.keys(result.updatedInput).length > 0 ? updatedInput : input → {} → use original → mobile push notification → no args fallback
# {} empty object use original
# mobile push notification
# don't run with no args
```

### deny + interrupt Abort

```
result.behavior === 'deny' && result.interrupt → abortController.abort() → cancel execution → interrupt signal → stop operation
# deny + interrupt abort
# abort controller
# cancel execution
```

### logForDebugging warn Not Crash

```
logForDebugging('Malformed ...', { level: 'warn' }) → warn → not crash → debug trace → graceful continue
# logForDebugging warn not crash
# warning level
# graceful continue
```

## 借用价值

- ⭐⭐⭐⭐⭐ .catch(undefined) graceful degradation pattern
- ⭐⭐⭐⭐⭐ SDK hosts malformed entries pattern
- ⭐⭐⭐⭐⭐ {} empty object use original pattern
- ⭐⭐⭐⭐⭐ deny + interrupt abort pattern
- ⭐⭐⭐⭐⭐ logForDebugging warn not crash pattern

## 来源

- Claude Code: `utils/permissions/PermissionPromptToolResultSchema.ts` (93 lines)
- 分析报告: P59-11