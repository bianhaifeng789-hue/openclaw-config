---
name: code-indexing-detection
description: "Code indexing tool detection. CodeIndexingTool (30+ tools: Sourcegraph/Cody/Aider/Cursor/GitHub Copilot/Codeium/Tabnine/Windsurf/Amazon Q/Gemini) + CLI_COMMAND_MAPPING + MCP_SERVER_PATTERNS + detectCodeIndexingFromCommand + detectCodeIndexingFromMcp + Analytics tracking. Use when [code indexing detection] is needed."
metadata:
  openclaw:
    emoji: "🔍"
    triggers: [code-indexing, tool-detection]
    feishuCard: true
---

# Code Indexing Detection Skill - Code Indexing Detection

Code Indexing Detection 代码索引工具检测。

## 为什么需要这个？

**场景**：
- Detect code indexing tools
- CLI command detection
- MCP server detection
- Analytics tracking
- Tool usage patterns

**Claude Code 方案**：codeIndexing.ts + 208+ lines
**OpenClaw 飞书适配**：Code indexing + Tool detection

---

## Types

### CodeIndexingTool

```typescript
export type CodeIndexingTool =
  // Code search engines
  | 'sourcegraph'
  | 'hound'
  | 'seagoat'
  | 'bloop'
  | 'gitloop'
  // AI coding assistants with indexing
  | 'cody'
  | 'aider'
  | 'continue'
  | 'github-copilot'
  | 'cursor'
  | 'tabby'
  | 'codeium'
  | 'tabnine'
  | 'augment'
  | 'windsurf'
  | 'aide'
  | 'pieces'
  | 'qodo'
  | 'amazon-q'
  | 'gemini'
  // MCP code indexing servers
  | 'claude-context'
  | 'code-index-mcp'
  | 'local-code-search'
  | 'autodev-codebase'
  // Context providers
  | 'openctx'
```

---

## Mappings

### CLI_COMMAND_MAPPING

```typescript
const CLI_COMMAND_MAPPING: Record<string, CodeIndexingTool> = {
  // Sourcegraph ecosystem
  src: 'sourcegraph',
  cody: 'cody',
  // AI coding assistants
  aider: 'aider',
  tabby: 'tabby',
  tabnine: 'tabnine',
  augment: 'augment',
  pieces: 'pieces',
  qodo: 'qodo',
  aide: 'aide',
  // Code search tools
  hound: 'hound',
  seagoat: 'seagoat',
  bloop: 'bloop',
  gitloop: 'gitloop',
  // Cloud provider AI assistants
  q: 'amazon-q',
  gemini: 'gemini',
}
```

### MCP_SERVER_PATTERNS

```typescript
const MCP_SERVER_PATTERNS: Array<{
  pattern: RegExp
  tool: CodeIndexingTool
}> = [
  // Sourcegraph ecosystem
  { pattern: /^sourcegraph$/i, tool: 'sourcegraph' },
  { pattern: /^cody$/i, tool: 'cody' },
  { pattern: /^openctx$/i, tool: 'openctx' },
  // AI coding assistants
  { pattern: /^aider$/i, tool: 'aider' },
  { pattern: /^continue$/i, tool: 'continue' },
  { pattern: /^github[-_]?copilot$/i, tool: 'github-copilot' },
  { pattern: /^cursor$/i, tool: 'cursor' },
  { pattern: /^codeium$/i, tool: 'codeium' },
  { pattern: /^windsurf$/i, tool: 'windsurf' },
  // MCP code indexing servers
  { pattern: /^claude[-_]?context$/i, tool: 'claude-context' },
  { pattern: /^code[-_]?index[-_]?mcp$/i, tool: 'code-index-mcp' },
  // ...
]
```

---

## Functions

### 1. Detect from CLI Command

```typescript
export function detectCodeIndexingFromCommand(
  command: string,
): CodeIndexingTool | undefined {
  const trimmed = command.trim()
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase()

  if (!firstWord) return undefined

  // Check for npx/bunx prefixed commands
  if (firstWord === 'npx' || firstWord === 'bunx') {
    const secondWord = trimmed.split(/\s+/)[1]?.toLowerCase()
    if (secondWord && secondWord in CLI_COMMAND_MAPPING) {
      return CLI_COMMAND_MAPPING[secondWord]
    }
  }

  return CLI_COMMAND_MAPPING[firstWord]
}
```

### 2. Detect from MCP

```typescript
export function detectCodeIndexingFromMcp(
  serverName: string,
): CodeIndexingTool | undefined {
  for (const { pattern, tool } of MCP_SERVER_PATTERNS) {
    if (pattern.test(serverName)) return tool
  }
  return undefined
}
```

---

## 飞书卡片格式

### Code Indexing Detection 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔍 Code Indexing Detection**\n\n---\n\n**Tools (30+)**：\n• Sourcegraph + Cody + Aider\n• Cursor + GitHub Copilot + Codeium\n• Tabnine + Windsurf + Amazon Q\n• Gemini + Claude Context\n\n---\n\n**Functions**：\n• detectCodeIndexingFromCommand()\n• detectCodeIndexingFromMcp()\n\n---\n\n**Mappings**：\n• CLI_COMMAND_MAPPING\n• MCP_SERVER_PATTERNS\n\n---\n\n**Analytics**：Tool usage tracking"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/code-indexing-detection-state.json
{
  "stats": {
    "totalDetections": 0,
    "toolsDetected": []
  },
  "lastUpdate": "2026-04-12T11:26:00Z",
  "notes": "Code Indexing Detection Skill 创建完成。"
}