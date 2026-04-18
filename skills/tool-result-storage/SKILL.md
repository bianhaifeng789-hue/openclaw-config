---
name: tool-result-storage
description: |
  Persist large tool results to disk instead of truncating. Retrieve persisted results by ID. Clear old results to save context tokens.
  
  Use when:
  - Tool output exceeds token limit (default 50k chars)
  - Need to reference large file reads or bash outputs later
  - Clearing old tool results to reduce context size
  
  Keywords: tool result, persist, large output, disk storage, context reduction
metadata:
  openclaw:
    emoji: "💾"
    source: claude-code-tool-result-storage
    triggers: [large-output, persist-result, context-overflow]
    priority: P2
---

# Tool Result Storage

基于 Claude Code `utils/toolResultStorage.ts` 的大型工具结果磁盘持久化。

## 核心概念（来自 Claude Code）

### 常量
```typescript
const DEFAULT_MAX_RESULT_SIZE_CHARS = 50_000  // 默认截断阈值
const MAX_TOOL_RESULT_BYTES = 1_000_000       // 单个结果最大 1MB
const PREVIEW_SIZE_BYTES = 2000               // 预览大小

const PERSISTED_OUTPUT_TAG = '<persisted-output>'
const TOOL_RESULT_CLEARED_MESSAGE = '[Old tool result content cleared]'
```

### 存储路径
```
.claude/sessions/<sessionId>/tool-results/
  <toolUseId>.txt      # 文本结果
  <toolUseId>.json     # JSON 结果
```

### 核心操作

**persistToolResult(toolUseId, content)**:
```
1. 如果 content.length > threshold：
   a. 写入磁盘文件
   b. 返回 <persisted-output>file://<path></persisted-output>
2. 否则直接返回 content
```

**processToolResultBlock(block)**:
```
1. 检查 content 是否包含 <persisted-output> 标签
2. 如果是：从磁盘读取完整内容
3. 否则：直接使用 content
```

## OpenClaw 适配实现

### 存储目录
```
memory/tool-results/
  <sessionDate>_<toolUseId>.txt
```

### 实现

```javascript
const PERSIST_THRESHOLD = 50000  // 50k chars

async function persistToolResult(toolUseId, content) {
  if (content.length <= PERSIST_THRESHOLD) {
    return content
  }
  
  const filename = `memory/tool-results/${toolUseId}.txt`
  await writeFile(filename, content, 'utf-8')
  
  // 返回预览 + 引用
  const preview = content.slice(0, 2000)
  return `${preview}\n...[截断，完整内容已保存到 ${filename}]\n<persisted-output>file://${filename}</persisted-output>`
}

async function retrieveToolResult(content) {
  const match = content.match(/<persisted-output>file:\/\/(.+?)<\/persisted-output>/)
  if (!match) return content
  
  try {
    return await readFile(match[1], 'utf-8')
  } catch {
    return content  // 文件不存在时返回原始内容
  }
}
```

### 清理策略

```javascript
// 清理超过 24 小时的工具结果
async function cleanupOldToolResults() {
  const dir = 'memory/tool-results/'
  const files = await readdir(dir)
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  
  for (const file of files) {
    const stat = await statFile(join(dir, file))
    if (stat.mtimeMs < cutoff) {
      await unlink(join(dir, file))
    }
  }
}
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 存储路径 | `.claude/sessions/<id>/tool-results/` | `memory/tool-results/` |
| 阈值配置 | GrowthBook 远端配置（按工具名） | 固定 50k |
| 清理时机 | session 结束时 | heartbeat 定期清理 |
| 图片处理 | 单独处理（>2000 tokens 清除） | 不实现 |
