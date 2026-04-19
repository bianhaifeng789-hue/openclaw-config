# Transcript Compact Classifier Skill

Transcript Compact Classifier - buildTranscriptEntries user text + assistant tool_use + buildTranscriptForClassifier + toCompactBlock JSONL dict + isJsonlTranscriptEnabled + buildToolLookup + toAutoClassifierInput per-tool projection + toolLookup Map + user text blocks + tool_use blocks only + JSONL format {"Bash":"ls"} vs text format `Bash ls`。

## 功能概述

从Claude Code的utils/permissions/yoloClassifier.ts提取的Transcript compact classifier模式，用于OpenClaw的分类器输入构建。

## 核心机制

### buildTranscriptEntries user text + assistant tool_use

```typescript
export function buildTranscriptEntries(messages: Message[]): TranscriptEntry[] {
  const transcript: TranscriptEntry[] = []
  for (const msg of messages) {
    if (msg.type === 'attachment' && msg.attachment.type === 'queued_command') {
      // Extract queued user command
      transcript.push({ role: 'user', content: [{ type: 'text', text: prompt }] })
    } else if (msg.type === 'user') {
      // User text blocks only
      transcript.push({ role: 'user', content: textBlocks })
    } else if (msg.type === 'assistant') {
      // Assistant tool_use blocks only (exclude assistant text)
      const blocks = msg.message.content.filter(b => b.type === 'tool_use')
      transcript.push({ role: 'assistant', content: blocks })
    }
  }
  return transcript
}
// buildTranscriptEntries
# User text blocks
# Assistant tool_use only
# Exclude assistant text
```

### buildTranscriptForClassifier

```typescript
export function buildTranscriptForClassifier(messages: Message[], tools: Tools): string {
  const lookup = buildToolLookup(tools)
  return buildTranscriptEntries(messages).map(e => toCompact(e, lookup)).join('')
}
// buildTranscriptForClassifier
# Tool lookup map
# Compact entries
# Join string
```

### toCompactBlock JSONL dict

```typescript
function toCompactBlock(block: TranscriptBlock, role: TranscriptEntry['role'], lookup: ToolLookup): string {
  if (block.type === 'tool_use') {
    const tool = lookup.get(block.name)
    const encoded = tool.toAutoClassifierInput(input) ?? input
    if (encoded === '') return ''
    if (isJsonlTranscriptEnabled()) {
      return jsonStringify({ [block.name]: encoded }) + '\n'
    }
    return `${block.name} ${encoded}\n`
  }
  if (block.type === 'text' && role === 'user') {
    return isJsonlTranscriptEnabled()
      ? jsonStringify({ user: block.text }) + '\n'
      : `User: ${block.text}\n`
  }
  return ''
}
// toCompactBlock
# JSONL: {"Bash":"ls"}\n
# Text: Bash ls\n
# '' for no security relevance
```

### isJsonlTranscriptEnabled

```typescript
function isJsonlTranscriptEnabled(): boolean {
  if (process.env.USER_TYPE === 'ant') {
    const env = process.env.CLAUDE_CODE_JSONL_TRANSCRIPT
    if (isEnvTruthy(env)) return true
    if (isEnvDefinedFalsy(env)) return false
  }
  const config = getFeatureValue_CACHED_MAY_BE_STALE('tengu_auto_mode_config', {} as AutoModeConfig)
  return config?.jsonlTranscript === true
}
// isJsonlTranscriptEnabled
# GrowthBook config
# JSONL vs text format
# Ant-only env var
```

### buildToolLookup

```typescript
function buildToolLookup(tools: Tools): ToolLookup {
  const map = new Map<string, Tool>()
  for (const tool of tools) {
    map.set(tool.name, tool)
    for (const alias of tool.aliases ?? []) {
      map.set(alias, tool)
    }
  }
  return map
}
// buildToolLookup
# Map<toolName, Tool>
# Include aliases
# Lookup by name
```

### toAutoClassifierInput per-tool projection

```typescript
// Each tool controls which fields get exposed
const encoded = tool.toAutoClassifierInput(input) ?? input
// '' = "no security relevance" (Tool.toAutoClassifierInput contract)
if (encoded === '') return ''
// toAutoClassifierInput
# Per-tool projection
# '' = no security relevance
# Skip in transcript
```

### toolLookup Map

```typescript
type ToolLookup = ReadonlyMap<string, Tool>
// ToolLookup
# Map for fast lookup
# toolName → Tool
# Alias support
```

### user text blocks

```typescript
// User messages: only text blocks
if (msg.type === 'user') {
  const textBlocks: TranscriptBlock[] = []
  for (const block of content) {
    if (block.type === 'text') {
      textBlocks.push({ type: 'text', text: block.text })
    }
  }
  transcript.push({ role: 'user', content: textBlocks })
}
// User text blocks
# Only text content
# No tool_use in user
```

### tool_use blocks only

```typescript
// Assistant messages: only tool_use blocks
// Assistant text is model-authored and could be crafted to influence the classifier
for (const block of msg.message.content) {
  if (block.type === 'tool_use') {
    blocks.push({ type: 'tool_use', name: block.name, input: block.input })
  }
}
// tool_use blocks only
# Exclude assistant text
# Could influence classifier
# Only tool_use
```

### JSONL vs text format

```typescript
// JSONL format
jsonStringify({ [block.name]: encoded }) + '\n'  // {"Bash":"ls"}\n
jsonStringify({ user: block.text }) + '\n'       // {"user":"text"}\n

// Text format
`${block.name} ${encoded}\n`  // Bash ls\n
`User: ${block.text}\n`       // User: text\n
// JSONL vs text format
# JSONL: {"Bash":"ls"}
# Text: Bash ls
# GrowthBook config
```

## 实现建议

### OpenClaw适配

1. **transcriptBuilder**: buildTranscriptEntries pattern
2. **compactBlock**: toCompactBlock JSONL/text pattern
3. **toolLookup**: buildToolLookup + aliases pattern
4. **classifierProjection**: toAutoClassifierInput pattern
5. **formatToggle**: isJsonlTranscriptEnabled pattern

### 状态文件示例

```json
{
  "format": "jsonl",
  "transcript": ["{\"user\":\"install package\"}", "{\"Bash\":\"npm install\"}"],
  "entries": 2
}
```

## 关键模式

### User Text + Assistant tool_use Only

```
user: text blocks only | assistant: tool_use only → exclude assistant text → could influence classifier → only tool_use
# user text + assistant tool_use only
# user: text blocks
# assistant: tool_use only
```

### JSONL Dict vs Text Prefix

```
JSONL: {"Bash":"ls"}\n | Text: Bash ls\n → isJsonlTranscriptEnabled → GrowthBook config → format toggle
# JSONL dict vs text prefix
# JSONL: {"Bash":"ls"}
# Text: Bash ls
```

### toAutoClassifierInput Per-Tool

```
tool.toAutoClassifierInput(input) → per-tool projection → '' = no security relevance → skip in transcript → each tool controls
# toAutoClassifierInput per-tool
# '' = no security relevance
# skip in transcript
```

### Tool Lookup Map + Aliases

```
Map<toolName, Tool> + aliases → buildToolLookup → fast lookup → name + aliases → lookup map
# tool lookup map + aliases
# include aliases
# fast lookup
```

### '' No Security Relevance Contract

```
encoded === '' → no security relevance → return '' → skip in transcript → Tool.toAutoClassifierInput contract
# '' no security relevance contract
# '' = skip
# no security relevance
```

## 借用价值

- ⭐⭐⭐⭐⭐ User text + assistant tool_use only pattern
- ⭐⭐⭐⭐⭐ JSONL dict vs text prefix pattern
- ⭐⭐⭐⭐⭐ toAutoClassifierInput per-tool pattern
- ⭐⭐⭐⭐⭐ Tool lookup map + aliases pattern
- ⭐⭐⭐⭐ '' no security relevance contract pattern

## 来源

- Claude Code: `utils/permissions/yoloClassifier.ts` (673 lines)
- 分析报告: P58-6