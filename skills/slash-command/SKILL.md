---
name: slash-command
description: "Slash command parsing. parseSlashCommand + ParsedSlashCommand type (commandName/args/isMcp) + MCP command detection ('(MCP)' marker) + Command name extraction + Args extraction. Use when [slash command] is needed."
metadata:
  openclaw:
    emoji: "⚡"
    triggers: [slash-parse, command-parse]
    feishuCard: true
---

# Slash Command Skill - Slash Command

Slash Command 斜杠命令解析。

## 为什么需要这个？

**场景**：
- Parse slash command
- Extract command name
- Extract arguments
- MCP detection
- Command routing

**Claude Code 方案**：slashCommandParsing.ts + 75+ lines
**OpenClaw 飞书适配**：Slash command parsing + MCP detection

---

## Types

```typescript
type ParsedSlashCommand = {
  commandName: string
  args: string
  isMcp: boolean
}
```

---

## Functions

### Parse Slash Command

```typescript
function parseSlashCommand(input: string): ParsedSlashCommand | null {
  const trimmedInput = input.trim()

  // Check if input starts with '/'
  if (!trimmedInput.startsWith('/')) {
    return null
  }

  // Remove the leading '/' and split by spaces
  const withoutSlash = trimmedInput.slice(1)
  const words = withoutSlash.split(' ')

  if (!words[0]) {
    return null
  }

  let commandName = words[0]
  let isMcp = false
  let argsStartIndex = 1

  // Check for MCP commands (second word is '(MCP)')
  if (words.length > 1 && words[1] === '(MCP)') {
    commandName = commandName + ' (MCP)'
    isMcp = true
    argsStartIndex = 2
  }

  // Extract arguments (everything after command name)
  const args = words.slice(argsStartIndex).join(' ')

  return {
    commandName,
    args,
    isMcp,
  }
}
```

---

## Examples

```typescript
parseSlashCommand('/search foo bar')
// => { commandName: 'search', args: 'foo bar', isMcp: false }

parseSlashCommand('/mcp:tool (MCP) arg1 arg2')
// => { commandName: 'mcp:tool (MCP)', args: 'arg1 arg2', isMcp: true }

parseSlashCommand('/help')
// => { commandName: 'help', args: '', isMcp: false }

parseSlashCommand('not a slash command')
// => null
```

---

## 飞书卡片格式

### Slash Command 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚡ Slash Command**\n\n---\n\n**parseSlashCommand()**：\n```typescript\nfunction parseSlashCommand(input: string):\n  ParsedSlashCommand | null\n```\n\n---\n\n**ParsedSlashCommand**：\n• commandName: string\n• args: string\n• isMcp: boolean\n\n---\n\n**MCP Detection**：\n• '(MCP)' marker"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/slash-command-state.json
{
  "stats": {
    "totalParsed": 0,
    "mcpCommands": 0,
    "regularCommands": 0
  },
  "lastUpdate": "2026-04-12T10:32:00Z",
  "notes": "Slash Command Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| slashCommandParsing.ts (75+ lines) | Skill + Slash |
| parseSlashCommand() | Parse command |
| MCP detection | '(MCP)' marker |
| ParsedSlashCommand | Type |

---

## 注意事项

1. **Must start with '/'** - Only slash commands
2. **MCP marker** - '(MCP)' second word
3. **Args extraction** - Everything after command
4. **Null return** - Invalid input returns null
5. **Trimmed input** - Whitespace trimmed

---

## 自动启用

此 Skill 在 slash command 时自动运行。

---

## 下一步增强

- 飞书 slash 集成
- Slash analytics
- Slash debugging