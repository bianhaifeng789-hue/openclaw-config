---
name: interrupt-detection
description: "Detect conversation interruption mid-turn. Check if last message is user (incomplete turn), tool_result without response, or attachment without response. Use for session recovery. Use when [interrupt detection] is needed."
metadata:
  openclaw:
    emoji: "⚡"
    triggers: [session-resume, conversation-recovery]
    feishuCard: true
---

# Interrupt Detection Skill - 对话中断检测

检测对话是否在 mid-turn 中断，用于会话恢复。

## 为什么需要这个？

**场景**：
- Session resume 时
- 对话中断恢复
- Mid-turn detection
- 自动继续未完成的任务

**Claude Code 方案**：conversationRecovery.ts + detectTurnInterruption
**OpenClaw 飞书适配**：中断检测 + 飞书卡片恢复提示

---

## Interrupt 类型

### 1. interrupted_prompt

**特征**：
- Last message 是 user
- 不是 meta message
- 不是 compact summary
- 不是 tool_result
- 模型还没开始响应

**处理**：
- 用户刚提问，模型未响应
- 恢复时需要重新处理这个 prompt

### 2. interrupted_turn

**特征**：
- Last message 是 tool_result（不是 terminal tool）
- 或 last message 是 attachment
- 模型在处理中中断

**处理**：
- 模型正在执行工具调用
- 恢复时自动继续

### 3. none

**特征**：
- Last message 是 assistant
- 或 meta/summary message
- Turn 完成

**处理**：
- 无需特殊处理

---

## 检测逻辑

```typescript
function detectTurnInterruption(messages: Message[]): InterruptState {
  if (messages.length === 0) {
    return { kind: 'none' }
  }

  // 找最后一个 turn-relevant message
  const lastMessage = findLastRelevantMessage(messages)

  if (lastMessage.type === 'assistant') {
    // Turn 完成
    return { kind: 'none' }
  }

  if (lastMessage.type === 'user') {
    if (lastMessage.isMeta || lastMessage.isCompactSummary) {
      return { kind: 'none' }
    }
    if (isToolUseResultMessage(lastMessage)) {
      // Brief mode terminal tool result
      if (isTerminalToolResult(lastMessage, messages)) {
        return { kind: 'none' }
      }
      return { kind: 'interrupted_turn' }
    }
    // 用户 prompt，模型未响应
    return { kind: 'interrupted_prompt', message: lastMessage }
  }

  if (lastMessage.type === 'attachment') {
    // Attachment 后模型未响应
    return { kind: 'interrupted_turn' }
  }

  return { kind: 'none' }
}
```

---

## 飞书卡片格式

### Interrupt Detection 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚡ Interrupt Detection**\n\n**检测到对话中断**\n\n**中断类型**：interrupted_prompt\n\n**最后消息**：\n```\n用户：帮我优化这段代码...\n```\n\n**状态**：模型未响应，任务未开始\n\n---\n\n**恢复建议**：\n自动继续处理用户的 prompt\n\n**是否自动继续？**"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "自动继续"},
          "type": "primary",
          "value": {"action": "auto_continue"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "手动处理"},
          "type": "default",
          "value": {"action": "manual"}
        }
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 检测中断

```
Interrupt Detection:
1. 读取 session messages
2. 找最后一个 relevant message
3. 判断 interrupt 类型
4. 返回 interrupt state
```

### 2. 处理中断

```typescript
async function handleInterrupt(state: InterruptState): Promise<void> {
  if (state.kind === 'none') {
    // 无中断，正常恢复
    return
  }

  if (state.kind === 'interrupted_prompt') {
    // 发送飞书卡片提示
    await sendInterruptCard(state)
    
    // 用户确认后，继续处理
    // 或自动继续（配置决定）
  }

  if (state.kind === 'interrupted_turn') {
    // 添加 continuation message
    const continuation = createUserMessage({
      content: 'Continue from where you left off.',
      isMeta: true
    })
    messages.push(continuation)
    
    // 自动继续执行
  }
}
```

---

## 持久化存储

```json
// memory/interrupt-detection-state.json
{
  "interruptsDetected": [
    {
      "sessionId": "session-1",
      "kind": "interrupted_prompt",
      "lastMessage": "帮我优化这段代码...",
      "timestamp": "2026-04-12T00:00:00Z",
      "recovered": true
    }
  ],
  "stats": {
    "interruptsDetected": 0,
    "interruptsRecovered": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| detectTurnInterruption | Skill + 检测逻辑 |
| Terminal tool result check | 同样检查 |
| Brief mode handling | 飞书场景可能无 brief mode |
| Auto continuation | 飞书卡片确认 |
| deserializeMessages | 恢复处理 |

---

## 注意事项

1. **Last message 检查**：找最后一个 turn-relevant message
2. **Skip system/progress**：跳过 system 和 progress message
3. **Brief mode**：检查是否是 terminal tool result
4. **Auto continuation**：添加 synthetic continuation message
5. **飞书卡片确认**：让用户选择是否自动继续

---

## 自动启用

此 Skill 在 session resume 时自动触发。

---

## 下一步增强

- Interrupt analytics
- Auto recovery rate
- Interrupt pattern detection
- Graceful recovery handling