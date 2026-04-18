# Permission Rule Value Schema Skill

Permission Rule Value Schema - permissionBehaviorSchema z.enum('allow','deny','ask') + permissionRuleValueSchema z.object(toolName+ruleContent?) + PermissionBehavior 'allow'|'deny'|'ask' + PermissionRuleValue {toolName: string, ruleContent?: string} + lazySchema(() => ...) + ruleContent optional + z.enum + z.object + zod/v4。

## 功能概述

从Claude Code的utils/permissions/PermissionRule.ts提取的Permission rule value schema，用于OpenClaw的权限规则定义。

## 核心机制

### permissionBehaviorSchema z.enum

```typescript
export const permissionBehaviorSchema = lazySchema(() =>
  z.enum(['allow', 'deny', 'ask']),
)
// permissionBehaviorSchema
# z.enum
# 'allow' | 'deny' | 'ask'
# Three behaviors
```

### PermissionBehavior 'allow'|'deny'|'ask'

```typescript
/**
 * ToolPermissionBehavior is the behavior associated with a permission rule.
 * 'allow' means the rule allows the tool to run.
 * 'deny' means the rule denies the tool from running.
 * 'ask' means the rule forces a prompt to be shown to the user.
 */
export type PermissionBehavior = 'allow' | 'deny' | 'ask'
// PermissionBehavior
# Three behaviors
# 'allow' → run
# 'deny' → block
# 'ask' → prompt
```

### permissionRuleValueSchema z.object

```typescript
export const permissionRuleValueSchema = lazySchema(() =>
  z.object({
    toolName: z.string(),
    ruleContent: z.string().optional(),
  }),
)
// permissionRuleValueSchema
# z.object
# toolName: string
# ruleContent: optional
```

### PermissionRuleValue {toolName, ruleContent?}

```typescript
/**
 * PermissionRuleValue is the content of a permission rule.
 * @param toolName - The name of the tool this rule applies to
 * @param ruleContent - The optional content of the rule.
 *   Each tool may implement custom handling in `checkPermissions()`
 */
export type PermissionRuleValue = {
  toolName: string
  ruleContent?: string
}
// PermissionRuleValue
# toolName: string
# ruleContent?: string
# Optional content
```

### lazySchema(() => ...)

```typescript
import { lazySchema } from '../lazySchema.js'

export const permissionBehaviorSchema = lazySchema(() =>
  z.enum(['allow', 'deny', 'ask']),
)
// lazySchema
# Deferred construction
# Avoid circular deps
# () => schema
```

### ruleContent optional

```typescript
ruleContent: z.string().optional()
// ruleContent optional
# Optional string
# Tool-specific content
# Bash(npm install) → 'npm install'
```

### z.enum + z.object

```typescript
z.enum(['allow', 'deny', 'ask'])  // Behavior enum
z.object({ toolName: z.string(), ruleContent: z.string().optional() })  // Rule value
// z.enum + z.object
# zod/v4
# Enum for behavior
# Object for rule value
```

## 实现建议

### OpenClaw适配

1. **behaviorSchema**: z.enum('allow','deny','ask') pattern
2. **ruleValueSchema**: z.object(toolName+ruleContent?) pattern
3. **lazySchemaPattern**: lazySchema(() => ...) pattern
4. **optionalContent**: ruleContent optional pattern
5. **zodTypes**: PermissionBehavior + PermissionRuleValue pattern

### 状态文件示例

```json
{
  "toolName": "Bash",
  "ruleContent": "npm install",
  "behavior": "allow"
}
```

## 关键模式

### z.enum Three Behaviors

```
z.enum(['allow', 'deny', 'ask']) → 'allow'|'deny'|'ask' → three behaviors → PermissionBehavior
# z.enum three behaviors
# 'allow' run
# 'deny' block
# 'ask' prompt
```

### z.object toolName + optional ruleContent

```
z.object({ toolName: z.string(), ruleContent: z.string().optional() }) → PermissionRuleValue → toolName + optional content
# z.object toolName + optional ruleContent
# toolName: string
# ruleContent?: string
```

### lazySchema Deferred Construction

```
lazySchema(() => z.enum(...)) → deferred construction → avoid circular deps → () => schema
# lazySchema deferred construction
# avoid circular deps
# () => schema
```

### Optional ruleContent Tool-Specific

```
ruleContent?: string → tool-specific content → Bash(npm install) → 'npm install' → each tool custom handling
# optional ruleContent tool-specific
# Bash(npm install) → 'npm install'
# each tool custom handling
```

### PermissionRuleValue Structure

```
{ toolName: string, ruleContent?: string } → PermissionRuleValue → rule structure → toolName + optional content
# PermissionRuleValue structure
# toolName mandatory
# ruleContent optional
```

## 借用价值

- ⭐⭐⭐⭐⭐ z.enum three behaviors pattern
- ⭐⭐⭐⭐⭐ z.object toolName + optional ruleContent pattern
- ⭐⭐⭐⭐⭐ lazySchema deferred construction pattern
- ⭐⭐⭐⭐ Optional ruleContent tool-specific pattern
- ⭐⭐⭐⭐ PermissionRuleValue structure pattern

## 来源

- Claude Code: `utils/permissions/PermissionRule.ts` (53 lines)
- 分析报告: P58-3