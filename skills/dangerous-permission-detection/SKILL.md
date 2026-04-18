# Dangerous Permission Detection Skill

Dangerous Permission Detection - isDangerousBashPermission python:* + isDangerousPowerShellPermission iex:* + isDangerousTaskPermission Agent allow + findDangerousClassifierPermissions + DANGEROUS_BASH_PATTERNS + CROSS_PLATFORM_CODE_EXEC + stripDangerousPermissionsForAutoMode + restoreDangerousPermissions stash + transitionPermissionMode。

## 功能概述

从Claude Code的utils/permissions/permissionSetup.ts提取的Dangerous permission detection模式，用于OpenClaw的auto mode危险权限检测。

## 核心机制

### isDangerousBashPermission python:*

```typescript
export function isDangerousBashPermission(toolName: string, ruleContent: string | undefined): boolean {
  if (toolName !== BASH_TOOL_NAME) return false
  
  // Tool-level allow (Bash with no content, or Bash(*)) - allows ALL commands
  if (ruleContent === undefined || ruleContent === '') return true
  if (content === '*') return true
  
  // Check for dangerous patterns with prefix syntax (e.g., "python:*")
  for (const pattern of DANGEROUS_BASH_PATTERNS) {
    if (content === `${lowerPattern}:*`) return true  // python:* allows any python command
    if (content === `${lowerPattern}*`) return true   // python* matches python, python3
    if (content === `${lowerPattern} *`) return true  // python * matches "python script.py"
    if (content.startsWith(`${lowerPattern} -`) && content.endsWith('*')) return true  // python -* matches "python -c 'code'"
  }
  return false
}
// isDangerousBashPermission
# python:* → dangerous
# node:* → dangerous
# interpreter patterns
# bypass classifier
```

### isDangerousPowerShellPermission iex:*

```typescript
export function isDangerousPowerShellPermission(toolName: string, ruleContent: string | undefined): boolean {
  if (toolName !== POWERSHELL_TOOL_NAME) return false
  
  // Tool-level allow - allows ALL commands
  if (ruleContent === undefined || ruleContent === '') return true
  if (content === '*') return true
  
  const patterns: readonly string[] = [
    ...CROSS_PLATFORM_CODE_EXEC,
    'pwsh', 'powershell', 'cmd', 'wsl',
    'iex', 'invoke-expression', 'icm', 'invoke-command',
    'start-process', 'saps', 'start', 'start-job', 'sajb',
    // ... more patterns
  ]
  
  for (const pattern of patterns) {
    if (content === pattern) return true
    if (content === `${pattern}:*`) return true
    // ...
  }
  return false
}
// isDangerousPowerShellPermission
# iex:* → dangerous
# invoke-expression:* → dangerous
# start-process:* → dangerous
# PowerShell-specific patterns
```

### isDangerousTaskPermission Agent allow

```typescript
export function isDangerousTaskPermission(toolName: string, _ruleContent: string | undefined): boolean {
  return normalizeLegacyToolName(toolName) === AGENT_TOOL_NAME
}
// isDangerousTaskPermission
# Agent allow → dangerous
# Bypass classifier sub-agent evaluation
# Delegation attack prevention
```

### findDangerousClassifierPermissions

```typescript
export function findDangerousClassifierPermissions(rules: PermissionRule[], cliAllowedTools: string[]): DangerousPermissionInfo[] {
  const dangerous: DangerousPermissionInfo[] = []
  
  // Check rules loaded from settings
  for (const rule of rules) {
    if (rule.ruleBehavior === 'allow' &&
        isDangerousClassifierPermission(rule.ruleValue.toolName, rule.ruleValue.ruleContent)) {
      dangerous.push({
        ruleValue: rule.ruleValue,
        source: rule.source,
        ruleDisplay: ruleString,
        sourceDisplay: formatPermissionSource(rule.source),
      })
    }
  }
  
  // Check CLI --allowed-tools arguments
  for (const toolSpec of cliAllowedTools) {
    // Parse tool spec: "Bash" or "Bash(pattern)"
    // ...
  }
  
  return dangerous
}
// findDangerousClassifierPermissions
# Check settings rules
# Check CLI args
# Return structured info
```

### DANGEROUS_BASH_PATTERNS

```typescript
// Dangerous patterns for Bash
DANGEROUS_BASH_PATTERNS: [
  'python', 'python3', 'node', 'npm', 'npx',
  'bash', 'sh', 'zsh', 'fish',
  'ruby', 'perl', 'php',
  // ... interpreters
]
// DANGEROUS_BASH_PATTERNS
# Script interpreters
# Execute arbitrary code
# Bypass classifier
```

### CROSS_PLATFORM_CODE_EXEC

```typescript
CROSS_PLATFORM_CODE_EXEC: [
  'curl', 'wget', 'fetch',  // download-and-execute
  'eval', 'exec',  // code execution
  // ... shared with PowerShell
]
// CROSS_PLATFORM_CODE_EXEC
# Shared patterns
# Bash + PowerShell
# Code execution
```

### stripDangerousPermissionsForAutoMode

```typescript
export function stripDangerousPermissionsForAutoMode(context: ToolPermissionContext): ToolPermissionContext {
  const rules: PermissionRule[] = []
  // ... collect rules from context
  
  const dangerousPermissions = findDangerousClassifierPermissions(rules, [])
  if (dangerousPermissions.length === 0) {
    return { ...context, strippedDangerousRules: context.strippedDangerousRules ?? {} }
  }
  
  for (const permission of dangerousPermissions) {
    logForDebugging(`Ignoring dangerous permission ${permission.ruleDisplay} from ${permission.sourceDisplay} (bypasses classifier)`)
  }
  
  // Stash removed rules
  const stripped: ToolPermissionRulesBySource = {}
  for (const perm of dangerousPermissions) {
    if (!isPermissionUpdateDestination(perm.source)) continue
    ;(stripped[perm.source] ??= []).push(permissionRuleValueToString(perm.ruleValue))
  }
  
  return {
    ...removeDangerousPermissions(context, dangerousPermissions),
    strippedDangerousRules: stripped,
  }
}
// stripDangerousPermissionsForAutoMode
# Remove dangerous rules
# Stash removed rules
# Log warnings
```

### restoreDangerousPermissions stash

```typescript
export function restoreDangerousPermissions(context: ToolPermissionContext): ToolPermissionContext {
  const stash = context.strippedDangerousRules
  if (!stash) return context
  
  let result = context
  for (const [source, ruleStrings] of Object.entries(stash)) {
    if (!ruleStrings || ruleStrings.length === 0) continue
    result = applyPermissionUpdate(result, {
      type: 'addRules',
      rules: ruleStrings.map(permissionRuleValueFromString),
      behavior: 'allow',
      destination: source as PermissionUpdateDestination,
    })
  }
  return { ...result, strippedDangerousRules: undefined }
}
// restoreDangerousPermissions
# Restore from stash
# Re-add rules
# Clear stash
```

### transitionPermissionMode

```typescript
export function transitionPermissionMode(fromMode: string, toMode: string, context: ToolPermissionContext): ToolPermissionContext {
  if (fromMode === toMode) return context
  
  // ... plan/auto transitions
  
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    const fromUsesClassifier = fromMode === 'auto' || (fromMode === 'plan' && isAutoModeActive())
    const toUsesClassifier = toMode === 'auto'
    
    if (toUsesClassifier && !fromUsesClassifier) {
      if (!isAutoModeGateEnabled()) {
        throw new Error('Cannot transition to auto mode: gate is not enabled')
      }
      setAutoModeActive(true)
      context = stripDangerousPermissionsForAutoMode(context)
    } else if (fromUsesClassifier && !toUsesClassifier) {
      setAutoModeActive(false)
      setNeedsAutoModeExitAttachment(true)
      context = restoreDangerousPermissions(context)
    }
  }
  
  return context
}
// transitionPermissionMode
# Strip on enter
# Restore on exit
# State transitions
```

## 实现建议

### OpenClaw适配

1. **dangerousBash**: isDangerousBashPermission pattern
2. **dangerousPS**: isDangerousPowerShellPermission pattern
3. **dangerousAgent**: isDangerousTaskPermission pattern
4. **stripRestore**: strip/restore stash pattern
5. **modeTransition**: transitionPermissionMode pattern

### 状态文件示例

```json
{
  "dangerous": ["Bash(python:*)", "PowerShell(iex:*)", "Agent"],
  "stripped": {"userSettings": ["Bash(npm:*)"]}
}
```

## 关键模式

### Interpreter Prefix Patterns Dangerous

```
python:* | node:* | bash:* → interpreter prefix → allows arbitrary code → dangerous → bypass classifier
# interpreter prefix patterns dangerous
# python:* → dangerous
# node:* → dangerous
```

### PowerShell iex/start-process Dangerous

```
iex:* | invoke-expression:* | start-process:* → PowerShell specific → code execution → dangerous → bypass classifier
# PowerShell iex/start-process dangerous
# iex:* → dangerous
# invoke-expression:* → dangerous
```

### Agent Allow Bypasses Sub-Agent Eval

```
Agent allow rule → bypass classifier sub-agent evaluation → delegation attack prevention → dangerous → Task permission
# Agent allow bypasses sub-agent eval
# bypass classifier
# delegation attack
```

### Strip on Enter, Restore on Exit

```
enter auto → stripDangerousPermissionsForAutoMode → stash → exit auto → restoreDangerousPermissions → clear stash → strip/restore pattern
# strip on enter, restore on exit
# stash removed rules
# restore on exit
```

### Mode Transition State Machine

```
default → auto: strip | auto → default: restore | plan → auto: strip | auto → plan: keep → transitionPermissionMode → state machine
# mode transition state machine
# strip on auto enter
# restore on auto exit
```

## 借用价值

- ⭐⭐⭐⭐⭐ Interpreter prefix patterns dangerous pattern
- ⭐⭐⭐⭐⭐ PowerShell iex/start-process dangerous pattern
- ⭐⭐⭐⭐⭐ Agent allow bypasses sub-agent eval pattern
- ⭐⭐⭐⭐⭐ Strip on enter, restore on exit pattern
- ⭐⭐⭐⭐⭐ Mode transition state machine pattern

## 来源

- Claude Code: `utils/permissions/permissionSetup.ts` (771 lines)
- 分析报告: P59-3