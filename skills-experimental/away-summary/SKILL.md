# Away Summary Skill

**优先级**: P32
**来源**: Claude Code `awaySummary.ts`
**适用场景**: 用户离开后返回摘要生成

---

## 概述

Away Summary生成"While you were away"摘要，用于用户长时间未交互后返回时快速了解进度。使用最近30条消息 + session memory，调用small fast model生成1-3句摘要。

---

## 核心功能

### 1. 消息窗口

```typescript
const RECENT_MESSAGE_WINDOW = 30

export async function generateAwaySummary(
  messages: readonly Message[],
  signal: AbortSignal
): Promise<string | null> {
  if (messages.length === 0) return null
  
  const recent = messages.slice(-RECENT_MESSAGE_WINDOW)
  const memory = await getSessionMemoryContent()
  
  recent.push(createUserMessage({
    content: buildAwaySummaryPrompt(memory)
  }))
  
  return await queryModelWithoutStreaming({
    messages: recent,
    model: getSmallFastModel()
  })
}
```

### 2. Prompt构建

```typescript
function buildAwaySummaryPrompt(memory: string | null): string {
  const memoryBlock = memory
    ? `Session memory (broader context):\n${memory}\n\n`
    : ''
  
  return `${memoryBlock}The user stepped away and is coming back.
Write exactly 1-3 short sentences.
Start by stating the high-level task — what they are building or debugging.
Next: the concrete next step.
Skip status reports and commit recaps.`
}
```

---

## OpenClaw应用

### 1. 飞书长时间未交互

```typescript
// 用户超过1小时未发消息
const lastMessageTime = getLastMessageTime()
const now = Date.now()

if (now - lastMessageTime > 3600000) { // 1 hour
  const summary = await generateAwaySummary(messages)
  if (summary) {
    // 发送飞书卡片："你刚才在做什么..."
    await feishuApi.sendCard({
      title: "While you were away",
      content: summary
    })
  }
}
```

---

## 状态文件

```json
{
  "skill": "away-summary",
  "priority": "P32",
  "source": "awaySummary.ts",
  "enabled": true,
  "recentMessageWindow": 30,
  "maxSentences": 3,
  "model": "small-fast",
  "createdAt": "2026-04-12T14:00:00Z"
}
```

---

## 参考

- Claude Code: `awaySummary.ts`
- Session Memory: `sessionMemory.ts`