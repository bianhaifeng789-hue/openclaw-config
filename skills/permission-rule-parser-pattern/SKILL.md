# Permission Rule Parser Pattern Skill

Permission Rule Parser Pattern - escapeRuleContent \→\\ (→\( )→\) order matters + unescapeRuleContent reverse order + permissionRuleValueFromString ToolName(content) + findFirstUnescapedChar odd backslashes + findLastUnescapedChar reverse search + normalizeLegacyToolName aliases + LEGACY_TOOL_NAME_ALIASES Task→Agent + getLegacyToolNames reverse lookup。

## 功能概述

从Claude Code的utils/permissions/permissionRuleParser.ts提取的Permission rule parser模式，用于OpenClaw的权限规则解析。

## 核心机制

### escapeRuleContent \→\\ (→\( )→\) order matters

```typescript
export function escapeRuleContent(content: string): string {
  return content
    .replace(/\\/g, '\\\\')   // Escape backslashes first
    .replace(/\(/g, '\\(')    // Escape opening parentheses
    .replace(/\)/g, '\\)')    // Escape closing parentheses
}
// escapeRuleContent
# \ → \\ first
# ( → \( second
# ) → \) third
# Order matters
```

### unescapeRuleContent reverse order

```typescript
export function unescapeRuleContent(content: string): string {
  return content
    .replace(/\\\(/g, '(')    // Unescape opening parentheses first
    .replace(/\\\)/g, ')')    // Unescape closing parentheses second
    .replace(/\\\\/g, '\\')   // Unescape backslashes last
}
// unescapeRuleContent
# \( → ( first
# \) → ) second
# \\ → \ last
# Reverse order
```

### permissionRuleValueFromString ToolName(content)

```typescript
export function permissionRuleValueFromString(ruleString: string): PermissionRuleValue {
  // Find the first unescaped opening parenthesis
  const openParenIndex = findFirstUnescapedChar(ruleString, '(')
  if (openParenIndex === -1) {
    return { toolName: normalizeLegacyToolName(ruleString) }
  }

  // Find the last unescaped closing parenthesis
  const closeParenIndex = findLastUnescapedChar(ruleString, ')')
  // ... extract content
}
// permissionRuleValueFromString
# ToolName or ToolName(content)
# Unescaped parentheses
```

### findFirstUnescapedChar odd backslashes

```typescript
function findFirstUnescapedChar(str: string, char: string): number {
  for (let i = 0; i < str.length; i++) {
    if (str[i] === char) {
      // Count preceding backslashes
      let backslashCount = 0
      let j = i - 1
      while (j >= 0 && str[j] === '\\') {
        backslashCount++
        j--
      }
      // If even number of backslashes, the char is unescaped
      if (backslashCount % 2 === 0) {
        return i
      }
    }
  }
  return -1
}
// findFirstUnescapedChar
# Odd backslashes → escaped
# Even backslashes → unescaped
# Forward search
```

### findLastUnescapedChar reverse search

```typescript
function findLastUnescapedChar(str: string, char: string): number {
  for (let i = str.length - 1; i >= 0; i--) {
    // Same logic, but reverse search
  }
  return -1
}
// findLastUnescapedChar
# Reverse search
# Last unescaped
```

### normalizeLegacyToolName aliases

```typescript
const LEGACY_TOOL_NAME_ALIASES: Record<string, string> = {
  Task: AGENT_TOOL_NAME,
  KillShell: TASK_STOP_TOOL_NAME,
  AgentOutputTool: TASK_OUTPUT_TOOL_NAME,
  BashOutputTool: TASK_OUTPUT_TOOL_NAME,
  ...(feature('KAIROS') ? { Brief: BRIEF_TOOL_NAME } : {}),
}

export function normalizeLegacyToolName(name: string): string {
  return LEGACY_TOOL_NAME_ALIASES[name] ?? name
}
// normalizeLegacyToolName
# Aliases map
# Legacy → canonical
# Task → Agent
```

### LEGACY_TOOL_NAME_ALIASES Task→Agent

```typescript
Task: AGENT_TOOL_NAME,          // Task → Agent
KillShell: TASK_STOP_TOOL_NAME, // KillShell → TaskStop
AgentOutputTool: TASK_OUTPUT_TOOL_NAME, // AgentOutputTool → TaskOutput
// LEGACY_TOOL_NAME_ALIASES
# Tool renamed
# Legacy support
# Permission rules resolve
```

### getLegacyToolNames reverse lookup

```typescript
export function getLegacyToolNames(canonicalName: string): string[] {
  const result: string[] = []
  for (const [legacy, canonical] of Object.entries(LEGACY_TOOL_NAME_ALIASES)) {
    if (canonical === canonicalName) result.push(legacy)
  }
  return result
}
// getLegacyToolNames
# Reverse lookup
# Canonical → legacy[]
# All aliases
```

### permissionRuleValueToString

```typescript
export function permissionRuleValueToString(ruleValue: PermissionRuleValue): string {
  if (!ruleValue.ruleContent) {
    return ruleValue.toolName
  }
  const escapedContent = escapeRuleContent(ruleValue.ruleContent)
  return `${ruleValue.toolName}(${escapedContent})`
}
// permissionRuleValueToString
# ToolName or ToolName(content)
# Escape content
```

## 实现建议

### OpenClaw适配

1. **escapeRuleContent**: \→\\ (→\( )→\) order pattern
2. **unescapeRuleContent**: Reverse order pattern
3. **unescapedChar**: Odd/even backslashes pattern
4. **legacyAliases**: LEGACY_TOOL_NAME_ALIASES pattern
5. **ruleParser**: permissionRuleValueFromString pattern

### 状态文件示例

```json
{
  "original": "Bash(python -c \"print(1)\")",
  "escaped": "Bash(python -c \"print\\(1\\)\")",
  "parsed": {"toolName": "Bash", "ruleContent": "python -c \"print(1)\""}
}
```

## 关键模式

### Escape Order Matters

```
\ → \\ first → ( → \( second → ) → \) third → order matters → prevent double-escape
# escape order matters
# \ first
# ( second
# ) third
```

### Unescape Reverse Order

```
\( → ( first → \) → ) second → \\ → \ last → reverse order → correct unescape
# unescape reverse order
# reverse of escape
# correct unescape
```

### Odd/Even Backslashes Escaped

```
odd backslashes → escaped → even backslashes → unescaped → findFirstUnescapedChar → char preceded by backslashes
# odd/even backslashes escaped
# odd → escaped
# even → unescaped
```

### Legacy Aliases Tool Renamed

```
Task → Agent | KillShell → TaskStop | AgentOutputTool → TaskOutput → legacy aliases → tool renamed
# legacy aliases tool renamed
# Task → Agent
# permission rules resolve
```

### ToolName(content) Format

```
ToolName → {toolName} | ToolName(content) → {toolName, ruleContent} → format → parse
# ToolName(content) format
# No content: just toolName
# With content: extract
```

## 借用价值

- ⭐⭐⭐⭐⭐ Escape order matters pattern
- ⭐⭐⭐⭐⭐ Unescape reverse order pattern
- ⭐⭐⭐⭐⭐ Odd/even backslashes escaped pattern
- ⭐⭐⭐⭐⭐ Legacy aliases tool renamed pattern
- ⭐⭐⭐⭐⭐ ToolName(content) format pattern

## 来源

- Claude Code: `utils/permissions/permissionRuleParser.ts` (165 lines)
- 分析报告: P58-4