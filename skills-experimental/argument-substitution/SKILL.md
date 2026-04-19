---
name: argument-substitution
description: "Argument substitution for skill/command prompts. substituteArguments + parseArguments + parseArgumentNames + $ARGUMENTS/$ARGUMENTS[0]/$0/$foo named args + generateProgressiveArgumentHint + shell-quote parsing. Use when substituting arguments, binding parameters, or resolving placeholders."
metadata:
  openclaw:
    emoji: "💬"
    triggers: [argument-substitute, skill-arguments]
    feishuCard: true
---

# Argument Substitution Skill - Argument Substitution

Argument Substitution 参数替换工具。

## 为什么需要这个？

**场景**：
- Skill/Command prompts
- $ARGUMENTS substitution
- Named argument support
- Shell-quote parsing
- Progressive argument hints

**Claude Code 方案**：argumentSubstitution.ts + 180+ lines
**OpenClaw 飞书适配**：Argument substitution + $ARGUMENTS

---

## Functions

### 1. Parse Arguments

```typescript
function parseArguments(args: string): string[] {
  if (!args || !args.trim()) {
    return []
  }

  // Use shell-quote for proper parsing
  const result = tryParseShellCommand(args, key => `$${key}`)
  if (!result.success) {
    // Fall back to simple whitespace split
    return args.split(/\s+/).filter(Boolean)
  }

  // Filter to only string tokens
  return result.tokens.filter(
    (token): token is string => typeof token === 'string',
  )
}
```

### 2. Substitute Arguments

```typescript
function substituteArguments(
  content: string,
  args: string | undefined,
  appendIfNoPlaceholder = true,
  argumentNames: string[] = [],
): string {
  if (args === undefined || args === null) {
    return content
  }

  const parsedArgs = parseArguments(args)
  const originalContent = content

  // Replace named arguments ($foo, $bar)
  for (let i = 0; i < argumentNames.length; i++) {
    const name = argumentNames[i]
    if (!name) continue

    content = content.replace(
      new RegExp(`\\$${name}(?![\\[\\w])`, 'g'),
      parsedArgs[i] ?? '',
    )
  }

  // Replace indexed arguments ($ARGUMENTS[0], $ARGUMENTS[1])
  content = content.replace(/\$ARGUMENTS\[(\d+)\]/g, (_, indexStr: string) => {
    const index = parseInt(indexStr, 10)
    return parsedArgs[index] ?? ''
  })

  // Replace shorthand ($0, $1)
  content = content.replace(/\$(\d+)(?!\w)/g, (_, indexStr: string) => {
    const index = parseInt(indexStr, 10)
    return parsedArgs[index] ?? ''
  })

  // Replace $ARGUMENTS
  content = content.replaceAll('$ARGUMENTS', args)

  // Append if no placeholder found
  if (content === originalContent && appendIfNoPlaceholder && args) {
    content = content + `\n\nARGUMENTS: ${args}`
  }

  return content
}
```

### 3. Generate Progressive Hint

```typescript
function generateProgressiveArgumentHint(
  argNames: string[],
  typedArgs: string[],
): string | undefined {
  const remaining = argNames.slice(typedArgs.length)
  if (remaining.length === 0) return undefined
  return remaining.map(name => `[${name}]`).join(' ')
}
```

---

## Placeholders

| Placeholder | Description |
|-------------|-------------|
| $ARGUMENTS | Full arguments string |
| $ARGUMENTS[0] | First argument |
| $ARGUMENTS[1] | Second argument |
| $0 | Shorthand for $ARGUMENTS[0] |
| $1 | Shorthand for $ARGUMENTS[1] |
| $foo | Named argument |

---

## 飞书卡片格式

### Argument Substitution 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**💬 Argument Substitution**\n\n---\n\n**Functions**：\n• parseArguments() - Shell-quote parsing\n• substituteArguments() - Substitute placeholders\n• generateProgressiveArgumentHint() - Hint\n\n---\n\n**Placeholders**：\n• $ARGUMENTS - Full string\n• $ARGUMENTS[0] - Indexed\n• $0 - Shorthand\n• $foo - Named\n\n---\n\n**Features**：\n• Shell-quote parsing\n• Named argument support\n• Progressive hints"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/argument-substitution-state.json
{
  "stats": {
    "totalSubstitutions": 0,
    "totalParsed": 0
  },
  "lastUpdate": "2026-04-12T10:52:00Z",
  "notes": "Argument Substitution Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| argumentSubstitution.ts (180+ lines) | Skill + Arguments |
| substituteArguments() | Substitution |
| $ARGUMENTS[0] | Indexed |
| Named args | $foo |

---

## 注意事项

1. **Shell-quote**：Proper parsing
2. **Indexed args**：$ARGUMENTS[0], $0
3. **Named args**：argumentNames mapping
4. **Progressive hint**：Remaining args
5. **Fallback**：Whitespace split

---

## 自动启用

此 Skill 在 argument substitution 时自动运行。

---

## 下一步增强

- 飞书 argument 集成
- Argument analytics
- Argument debugging