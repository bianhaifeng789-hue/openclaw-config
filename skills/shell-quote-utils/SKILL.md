---
name: shell-quote-utils
description: "Shell quote utilities for security. tryParseShellCommand + tryQuoteShellArgs + hasMalformedTokens + ShellParseResult + ShellQuoteResult + Command injection prevention + HackerOne #3482049 + Unterminated quotes detection. Use when [shell quote utils] is needed."
metadata:
  openclaw:
    emoji: "🔒"
    triggers: [shell-quote, command-injection]
    feishuCard: true
---

# Shell Quote Utils Skill - Shell Quote Utils

Shell Quote Utils Shell 引用安全工具。

## 为什么需要这个？

**场景**：
- Parse shell commands safely
- Quote shell arguments
- Detect malformed tokens
- Command injection prevention
- HackerOne #3482049 reference

**Claude Code 方案**：bash/shellQuote.ts + 305+ lines
**OpenClaw 飞书适配**：Shell quote + Security

---

## Security Reference

**HackerOne #3482049**：
- shell-quote misinterprets ambiguous input
- JSON-like strings with semicolons
- `echo {"hi":"hi;evil"}` parsed with `;` as operator

---

## Types

### ShellParseResult

```typescript
type ShellParseResult =
  | { success: true; tokens: ParseEntry[] }
  | { success: false; error: string }
```

### ShellQuoteResult

```typescript
type ShellQuoteResult =
  | { success: true; quoted: string }
  | { success: false; error: string }
```

---

## Functions

### 1. Try Parse Shell Command

```typescript
export function tryParseShellCommand(
  cmd: string,
  env?: Record<string, string | undefined> | ((key: string) => string | undefined),
): ShellParseResult {
  try {
    const tokens = typeof env === 'function'
      ? shellQuoteParse(cmd, env)
      : shellQuoteParse(cmd, env)
    return { success: true, tokens }
  } catch (error) {
    if (error instanceof Error) logError(error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parse error',
    }
  }
}
```

### 2. Try Quote Shell Args

```typescript
export function tryQuoteShellArgs(args: unknown[]): ShellQuoteResult {
  try {
    const validated: string[] = args.map((arg, index) => {
      if (arg === null || arg === undefined) return String(arg)
      
      const type = typeof arg
      
      if (type === 'string') return arg as string
      if (type === 'number' || type === 'boolean') return String(arg)
      
      if (type === 'object') {
        throw new Error(`Cannot quote argument at index ${index}: object values are not supported`)
      }
      
      throw new Error(`Cannot quote argument at index ${index}: unsupported type ${type}`)
    })
    
    const quoted = shellQuoteQuote(validated)
    return { success: true, quoted }
  } catch (error) {
    if (error instanceof Error) logError(error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown quote error',
    }
  }
}
```

### 3. Has Malformed Tokens

```typescript
export function hasMalformedTokens(command: string, parsed: ParseEntry[]): boolean {
  // Check for unterminated quotes in original command
  let inSingle = false
  let inDouble = false
  let doubleCount = 0
  let singleCount = 0
  
  for (let i = 0; i < command.length; i++) {
    const c = command[i]
    if (c === '\\' && !inSingle) {
      i++
      continue
    }
    if (c === '"' && !inSingle) {
      doubleCount++
      inDouble = !inDouble
    } else if (c === "'" && !inDouble) {
      singleCount++
      inSingle = !inSingle
    }
  }
  
  if (doubleCount % 2 !== 0 || singleCount % 2 !== 0) return true
  
  // Check for unbalanced braces
  for (const entry of parsed) {
    if (typeof entry !== 'string') continue
    
    const openBraces = (entry.match(/{/g) || []).length
    const closeBraces = (entry.match(/}/g) || []).length
    
    if (openBraces !== closeBraces) return true
  }
  
  return false
}
```

---

## 飞书卡片格式

### Shell Quote Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔒 Shell Quote Utils**\n\n---\n\n**Security**：\n• HackerOne #3482049\n• Command injection prevention\n• Malformed token detection\n• Unterminated quotes\n\n---\n\n**Functions**：\n• tryParseShellCommand()\n• tryQuoteShellArgs()\n• hasMalformedTokens()\n\n---\n\n**Checks**：\n• Unbalanced braces\n• Unterminated quotes\n• Ambiguous input patterns"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/shell-quote-utils-state.json
{
  "stats": {
    "totalParsed": 0,
    "malformedDetected": 0
  },
  "lastUpdate": "2026-04-12T11:15:00Z",
  "notes": "Shell Quote Utils Skill 创建完成。"
}