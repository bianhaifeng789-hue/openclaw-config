# Permission Types Skill

权限类型系统 - Discriminated union decision + Exhaustive mode union + Rule source hierarchy + Pending classifier check。

## 功能概述

从Claude Code的Permission Types提取的权限类型模式，用于OpenClaw的权限系统。

## 核心机制

### Discriminated Union Decision

```typescript
export type PermissionDecision<Input> =
  | PermissionAllowDecision<Input>
  | PermissionAskDecision<Input>
  | PermissionDenyDecision

export type PermissionAllowDecision<Input> = {
  behavior: 'allow'
  updatedInput?: Input
  decisionReason?: PermissionDecisionReason
}

export type PermissionAskDecision<Input> = {
  behavior: 'ask'
  message: string
  pendingClassifierCheck?: PendingClassifierCheck
}

export type PermissionDenyDecision = {
  behavior: 'deny'
  message: string
  decisionReason: PermissionDecisionReason
}
// behavior作为discriminator
// 类型安全decision处理
```

### Exhaustive Mode Union

```typescript
export type InternalPermissionMode = ExternalPermissionMode | 'auto' | 'bubble'
export type PermissionMode = InternalPermissionMode

export const INTERNAL_PERMISSION_MODES = [
  ...EXTERNAL_PERMISSION_MODES,
  ...(feature('TRANSCRIPT_CLASSIFIER') ? ['auto'] : []),
] as const satisfies readonly PermissionMode[]
// Exhaustive union for typecheck
// Feature-gated mode addition
```

### Rule Source Hierarchy

```typescript
export type PermissionRuleSource =
  | 'userSettings'
  | 'projectSettings'
  | 'localSettings'
  | 'flagSettings'
  | 'policySettings'
  | 'cliArg'
  | 'command'
  | 'session'
// Source hierarchy
// 决定rule优先级
```

### Pending Classifier Check

```typescript
export type PendingClassifierCheck = {
  command: string
  cwd: string
  descriptions: string[]
}
// If set, classifier check runs asynchronously
// May auto-approve before user responds
// Non-blocking allow evaluation
```

### Decision Reason Chain

```typescript
export type PermissionDecisionReason =
  | { type: 'rule', rule: PermissionRule }
  | { type: 'mode', mode: PermissionMode }
  | { type: 'subcommandResults', reasons: Map<string, PermissionResult> }
  | { type: 'hook', hookName: string, reason?: string }
  | { type: 'classifier', classifier: string, reason: string }
  | { type: 'workingDir', reason: string }
  | { type: 'safetyCheck', reason: string, classifierApprovable: boolean }
// Discriminated union reason
// Traceable decision chain
```

### Safety Check ClassifierApprovable

```typescript
| { type: 'safetyCheck', classifierApprovable: boolean }
// True → classifier can evaluate
// False → force prompt (Windows path bypass)
// 敏感文件可classifier评估
```

### Permission Update Types

```typescript
export type PermissionUpdate =
  | { type: 'addRules', destination, rules, behavior }
  | { type: 'replaceRules', destination, rules, behavior }
  | { type: 'removeRules', destination, rules, behavior }
  | { type: 'setMode', destination, mode }
  | { type: 'addDirectories', destination, directories }
  | { type: 'removeDirectories', destination, directories }
// Discriminated update operations
// Type-safe mutation
```

## 实现建议

### OpenClaw适配

1. **discriminatedDecision**: Discriminated union decision
2. **exhaustiveMode**: Exhaustive mode union
3. **ruleSource**: Rule source hierarchy
4. **pendingCheck**: Pending classifier check

### 状态文件示例

```json
{
  "behavior": "ask",
  "decisionReason": { "type": "rule", "rule": {...} },
  "pendingClassifierCheck": { "command": "npm run build" }
}
```

## 关键模式

### Discriminated Union Decision

```
behavior: 'allow' | 'ask' | 'deny' → type narrowing
// 编译时decision处理
// 不需要if/else链
```

### Pending Classifier

```
pendingClassifierCheck → async evaluation → may auto-approve
// 非阻塞allow评估
// 可能先于user respond
```

### Safety Check Gate

```
classifierApprovable: boolean → classifier vs force prompt
// 敏感路径分类器评估
// 强制prompt场景
```

### Exhaustive Union

```
InternalPermissionMode | 'auto' | 'bubble' → all modes covered
// 编译器检查遗漏
// Feature-gated addition
```

## 借用价值

- ⭐⭐⭐⭐⭐ Discriminated union decision
- ⭐⭐⭐⭐⭐ Pending classifier check
- ⭐⭐⭐⭐⭐ Safety check classifierApprovable
- ⭐⭐⭐⭐ Exhaustive mode union
- ⭐⭐⭐⭐ Decision reason chain

## 来源

- Claude Code: `types/permissions.ts`
- 分析报告: P39-3