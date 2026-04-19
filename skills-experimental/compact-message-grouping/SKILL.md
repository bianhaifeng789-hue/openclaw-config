---
name: compact-message-grouping
description: |
  Group conversation messages at API-round boundaries for compact/summarization. One group per API round-trip, split at new assistant response IDs.
  
  Use when:
  - Preparing messages for compact/summarization
  - Splitting conversation into logical API rounds
  - Identifying safe split points for context reduction
  
  Keywords: compact, message grouping, API round, conversation split, context reduction
metadata:
  openclaw:
    emoji: "📦"
    source: claude-code-compact-grouping
    triggers: [compact, message-grouping, context-reduction]
    priority: P2
---

# Compact Message Grouping

基于 Claude Code `services/compact/grouping.ts` 的消息分组算法，用于 compact/摘要前的消息分组。

## 核心概念（来自 Claude Code）

### 分组原则
```
每个 API 轮次 = 一个组
边界触发条件: 新的 assistant 响应开始（message.id 不同于上一个 assistant）
```

### 为什么按 API 轮次分组？
- API 合约要求每个 `tool_use` 在下一个 assistant 轮次前必须被解决
- 按 assistant.id 分组确保 `[tool_use(id=X), tool_result, tool_use(id=X)]` 在同一组
- 比按"用户消息"分组更细粒度，支持单用户消息的长 agentic 会话

## 核心实现（直接来自 Claude Code）

```javascript
function groupMessagesByApiRound(messages) {
  const groups = []
  let current = []
  let lastAssistantId = undefined

  for (const msg of messages) {
    // 新 assistant 响应开始 → 触发边界
    if (
      msg.type === 'assistant' &&
      msg.message.id !== lastAssistantId &&
      current.length > 0
    ) {
      groups.push(current)
      current = [msg]
    } else {
      current.push(msg)
    }
    
    if (msg.type === 'assistant') {
      lastAssistantId = msg.message.id
    }
  }

  if (current.length > 0) {
    groups.push(current)
  }

  return groups
}
```

## 使用场景

### Compact 前分组
```javascript
// 将消息分成 API 轮次组
const groups = groupMessagesByApiRound(messages)

// 保留最近 N 组，摘要其余
const keepGroups = 3
const toSummarize = groups.slice(0, -keepGroups)
const toKeep = groups.slice(-keepGroups)

// 对 toSummarize 生成摘要
const summary = await generateSummary(toSummarize.flat())
```

### 计算 token 分布
```javascript
const groups = groupMessagesByApiRound(messages)
groups.forEach((group, i) => {
  const tokens = estimateTokens(group)
  console.log(`Round ${i}: ${group.length} messages, ~${tokens} tokens`)
})
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 消息 ID | `message.message.id`（Anthropic API） | 需要适配 OpenClaw 消息格式 |
| 工具结果配对 | ensureToolResultPairing 修复悬空 | 不实现 |
| 提取原因 | 打破 compact.ts ↔ compactMessages.ts 循环依赖 | 直接使用 |
