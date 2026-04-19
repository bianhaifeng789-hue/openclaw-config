# Shadowed Rule Detection Pattern Skill

Shadowed Rule Detection Pattern - detectUnreachableRules ask/deny shadow + isSharedSettingSource projectSettings/policySettings/command + UnreachableRule discriminated union + ShadowType 'ask'|'deny' + isAllowRuleShadowedByAskRule tool-wide ask + isAllowRuleShadowedByDenyRule tool-wide deny + sandboxAutoAllowEnabled personal settings exception + generateFixSuggestion removal suggestion。

## 功能概述

从Claude Code的utils/permissions/shadowedRuleDetection.ts提取的Shadowed rule detection模式，用于OpenClaw的权限规则遮挡检测。

## 核心机制

### detectUnreachableRules ask/deny shadow

```typescript
export function detectUnreachableRules(
  context: ToolPermissionContext,
  options: DetectUnreachableRulesOptions,
): UnreachableRule[] {
  const unreachable: UnreachableRule[] = []

  const allowRules = getAllowRules(context)
  const askRules = getAskRules(context)
  const denyRules = getDenyRules(context)

  // Check each allow rule for shadowing
  for (const allowRule of allowRules) {
    // Check deny shadowing first (more severe)
    const denyResult = isAllowRuleShadowedByDenyRule(allowRule, denyRules)
    if (denyResult.shadowed) {
      unreachable.push({
        rule: allowRule,
        reason: `Blocked by "${denyResult.shadowedBy.ruleValue.toolName}" deny rule`,
        shadowedBy: denyResult.shadowedBy,
        shadowType: 'deny',
        fix: generateFixSuggestion('deny', denyResult.shadowedBy, allowRule),
      })
      continue // Don't also report ask-shadowing if deny-shadowed
    }

    // Check ask shadowing
    const askResult = isAllowRuleShadowedByAskRule(allowRule, askRules, options)
    if (askResult.shadowed) {
      unreachable.push({ ... })
    }
  }

  return unreachable
}
// detectUnreachableRules
# Check deny first (more severe)
# Then check ask
# Return unreachable list
```

### isSharedSettingSource projectSettings/policySettings/command

```typescript
export function isSharedSettingSource(source: PermissionRuleSource): boolean {
  return (
    source === 'projectSettings' ||
    source === 'policySettings' ||
    source === 'command'
  )
}

// Personal settings: userSettings, localSettings, cliArg, session, flagSettings
// Shared settings: projectSettings, policySettings, command
// isSharedSettingSource
# Shared: project/policy/command
# Personal: user/local/cli/session/flag
# Different behavior
```

### UnreachableRule discriminated union

```typescript
export type UnreachableRule = {
  rule: PermissionRule
  reason: string
  shadowedBy: PermissionRule
  shadowType: ShadowType
  fix: string
}

// discriminated union
# rule + reason + shadowedBy + shadowType + fix
# Structured info
# Fix suggestion
```

### ShadowType 'ask'|'deny'

```typescript
export type ShadowType = 'ask' | 'deny'

// deny: completely blocked - more severe
// ask: will always prompt - less severe
// ShadowType
# deny = blocked
# ask = prompt
# Severity order
```

### isAllowRuleShadowedByAskRule tool-wide ask

```typescript
function isAllowRuleShadowedByAskRule(
  allowRule: PermissionRule,
  askRules: PermissionRule[],
  options: DetectUnreachableRulesOptions,
): ShadowResult {
  const { toolName, ruleContent } = allowRule.ruleValue

  // Only check allow rules that have specific content (e.g., "Bash(ls:*)")
  if (ruleContent === undefined) return { shadowed: false }

  // Find any tool-wide ask rule for the same tool
  const shadowingAskRule = askRules.find(
    askRule =>
      askRule.ruleValue.toolName === toolName &&
      askRule.ruleValue.ruleContent === undefined,
  )

  if (!shadowingAskRule) return { shadowed: false }

  // Special case: Bash with sandbox auto-allow from personal settings
  if (toolName === BASH_TOOL_NAME && options.sandboxAutoAllowEnabled) {
    if (!isSharedSettingSource(shadowingAskRule.source)) {
      return { shadowed: false }  // Personal ask doesn't shadow with sandbox
    }
  }

  return { shadowed: true, shadowedBy: shadowingAskRule, shadowType: 'ask' }
}
// isAllowRuleShadowedByAskRule
# Tool-wide ask shadows specific allow
# ruleContent === undefined = tool-wide
# Sandbox exception for personal
```

### isAllowRuleShadowedByDenyRule tool-wide deny

```typescript
function isAllowRuleShadowedByDenyRule(
  allowRule: PermissionRule,
  denyRules: PermissionRule[],
): ShadowResult {
  const { toolName, ruleContent } = allowRule.ruleValue

  // Only check allow rules with specific content
  if (ruleContent === undefined) return { shadowed: false }

  // Find any tool-wide deny rule for the same tool
  const shadowingDenyRule = denyRules.find(
    denyRule =>
      denyRule.ruleValue.toolName === toolName &&
      denyRule.ruleValue.ruleContent === undefined,
  )

  if (!shadowingDenyRule) return { shadowed: false }

  return { shadowed: true, shadowedBy: shadowingDenyRule, shadowType: 'deny' }
}
// isAllowRuleShadowedByDenyRule
# Tool-wide deny shadows specific allow
# More severe than ask
# Completely blocked
```

### sandboxAutoAllowEnabled personal settings exception

```typescript
// Special case: Bash with sandbox auto-allow from personal settings
// If the ask rule is from personal settings, the user's own sandbox will auto-allow.
// If the ask rule is from shared settings, other team members may not have sandbox enabled.
if (toolName === BASH_TOOL_NAME && options.sandboxAutoAllowEnabled) {
  if (!isSharedSettingSource(shadowingAskRule.source)) {
    return { shadowed: false }  // Don't warn - sandbox handles it
  }
  // Fall through to warn - shared settings affect other team members
}
// sandboxAutoAllowEnabled
# Personal ask + sandbox → no warning
# Shared ask + sandbox → warn for team
# Team member context
```

### generateFixSuggestion removal suggestion

```typescript
function generateFixSuggestion(
  shadowType: ShadowType,
  shadowingRule: PermissionRule,
  shadowedRule: PermissionRule,
): string {
  const shadowingSource = formatSource(shadowingRule.source)
  const shadowedSource = formatSource(shadowedRule.source)
  const toolName = shadowingRule.ruleValue.toolName

  if (shadowType === 'deny') {
    return `Remove the "${toolName}" deny rule from ${shadowingSource}, or remove the specific allow rule from ${shadowedSource}`
  }
  return `Remove the "${toolName}" ask rule from ${shadowingSource}, or remove the specific allow rule from ${shadowedSource}`
}
// generateFixSuggestion
# Remove shadowing OR remove shadowed
# Two options
# User choice
```

## 实现建议

### OpenClaw适配

1. **shadowDetection**: detectUnreachableRules pattern
2. **sharedSource**: isSharedSettingSource pattern
3. **shadowType**: ShadowType discriminated union pattern
4. **sandboxException**: sandboxAutoAllowEnabled pattern
5. **fixSuggestion**: generateFixSuggestion pattern

### 状态文件示例

```json
{
  "rule": { "toolName": "Bash", "ruleContent": "ls:*" },
  "reason": "Blocked by \"Bash\" deny rule",
  "shadowType": "deny",
  "fix": "Remove the \"Bash\" deny rule from projectSettings"
}
```

## 关键模式

### Deny First More Severe

```
check deny shadowing first → more severe → completely blocked → then check ask → will prompt → severity order
# deny first more severe
# deny = blocked
# ask = prompt
```

### Tool-Wide Shadows Specific

```
tool-wide ask (ruleContent === undefined) + specific allow (ruleContent !== undefined) → shadow → unreachable → tool-wide shadows specific
# tool-wide shadows specific
# undefined vs defined
# precedence order
```

### isSharedSettingSource Shared vs Personal

```
projectSettings | policySettings | command → shared → team members affected | userSettings | localSettings → personal → sandbox exception
# isSharedSettingSource shared vs personal
# shared: team context
# personal: user context
```

### Sandbox Exception Personal Ask

```
sandboxAutoAllowEnabled + !isSharedSettingSource → personal ask → no warning → sandbox handles → exception pattern
# sandbox exception personal ask
# user's own sandbox
# no shadow warning
```

### Two-Option Fix Suggestion

```
Remove shadowing OR remove shadowed → two options → user choice → generateFixSuggestion → actionable fix
# two-option fix suggestion
# remove one or the other
# user decision
```

## 借用价值

- ⭐⭐⭐⭐⭐ Deny first more severe pattern
- ⭐⭐⭐⭐⭐ Tool-wide shadows specific pattern
- ⭐⭐⭐⭐⭐ isSharedSettingSource shared vs personal pattern
- ⭐⭐⭐⭐⭐ Sandbox exception personal ask pattern
- ⭐⭐⭐⭐⭐ Two-option fix suggestion pattern

## 来源

- Claude Code: `utils/permissions/shadowedRuleDetection.ts` (191 lines)
- 分析报告: P59-12