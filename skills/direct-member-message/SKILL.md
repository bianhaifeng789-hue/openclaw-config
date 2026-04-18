# Direct Member Message Skill

**优先级**: P29
**来源**: Claude Code `directMemberMessage.ts`
**适用场景**: 飞书群聊@成员消息语法

---

## 概述

Direct Member Message解析 `@agent-name message` 语法，直接发送消息给团队成员，绕过model处理。可用于飞书群聊中直接回复特定用户。

---

## 核心功能

### 1. 语法解析

```typescript
export function parseDirectMemberMessage(input: string): {
  recipientName: string
  message: string
} | null {
  const match = input.match(/^@([\w-]+)\s+(.+)$/s)
  if (!match) return null
  
  const [, recipientName, message] = match
  if (!recipientName || !message) return null
  
  const trimmedMessage = message.trim()
  if (!trimmedMessage) return null
  
  return { recipientName, message: trimmedMessage }
}
```

### 2. 直接发送

```typescript
export async function sendDirectMemberMessage(
  recipientName: string,
  message: string,
  teamContext: AppState['teamContext'],
  writeToMailbox?: WriteToMailboxFn
): Promise<DirectMessageResult>
```

---

## 实现要点

### 1. 团队成员查找

```typescript
// 在teamContext中查找成员
const member = Object.values(teamContext.teammates ?? {}).find(
  t => t.name === recipientName
)

if (!member) {
  return { success: false, error: 'unknown_recipient', recipientName }
}
```

### 2. 消息写入

```typescript
await writeToMailbox(
  recipientName,
  {
    from: 'user',
    text: message,
    timestamp: new Date().toISOString()
  },
  teamContext.teamName
)

return { success: true, recipientName }
```

---

## OpenClaw应用

### 1. 飞书群聊@语法

```typescript
// OpenClaw扩展：飞书群聊直接消息
export function parseFeishuDirectMessage(input: string): {
  recipientName: string
  message: string
} | null {
  // 支持 @成员名 消息 内容
  const match = input.match(/^@([\w-]+)\s+(.+)$/s)
  return match ? { recipientName: match[1], message: match[2].trim() } : null
}

// 检查是否是飞书群聊
if (chat_type === 'group') {
  const directMessage = parseFeishuDirectMessage(userMessage)
  if (directMessage) {
    // 直接发送给成员，不经过model
    return await sendDirectFeishuMessage(directMessage.recipientName, directMessage.message)
  }
}
```

### 2. 飞书私聊

```typescript
// 飞书私聊场景
export async function sendDirectFeishuMessage(
  recipientName: string,
  message: string
): Promise<void> {
  // 查找飞书用户
  const user = await feishuApi.searchUser(recipientName)
  if (!user) throw new Error(`User ${recipientName} not found`)
  
  // 发送私聊消息
  await feishuApi.sendMessage({
    receive_id_type: 'open_id',
    receive_id: user.open_id,
    content: message,
    msg_type: 'text'
  })
}
```

---

## 状态文件

```json
{
  "skill": "direct-member-message",
  "priority": "P29",
  "source": "directMemberMessage.ts",
  "enabled": true,
  "syntaxPattern": "^@([\w-]+)\\s+(.+)$",
  "messagesSent": 0,
  "lastRecipient": null,
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `directMemberMessage.ts`