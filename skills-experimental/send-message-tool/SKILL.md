# Send Message Tool Skill

消息发送工具 - Teammate mailbox + UDS Bridge + Auto-resume。

## 功能概述

从Claude Code的SendMessageTool提取的team消息模式，用于OpenClaw的多agent通信。

## 核心机制

### Message Types

```typescript
z.discriminatedUnion('type', [
  z.object({ type: z.literal('shutdown_request'), reason: z.string().optional() }),
  z.object({ type: z.literal('shutdown_response'), request_id: z.string(), approve: semanticBoolean() }),
  z.object({ type: z.literal('plan_approval_response'), request_id: z.string(), approve: semanticBoolean() })
])
```

### Address Schemes

```typescript
to: z.string().describe(
  'teammate name, "*" for broadcast, "uds:<socket-path>" for local peer, "bridge:<session-id>" for Remote Control'
)
parseAddress(input.to) // { scheme: 'bridge'|'uds'|'other', target }
```

### Mailbox写入

```typescript
await writeToMailbox(
  recipientName,
  { from: senderName, text: content, summary, timestamp, color },
  teamName
)
// 写入teammate的mailbox文件
// 后续teammate读取处理
```

### Auto-resume Stopped Agent

```typescript
if (task.status === 'running') {
  queuePendingMessage(agentId, input.message)
} else {
  // task stopped — auto-resume with message
  const result = await resumeAgentBackground({
    agentId, prompt: input.message, toolUseContext, canUseTool
  })
}
// Stopped agent自动恢复
```

### Bridge Cross-session

```typescript
if (addr.scheme === 'bridge') {
  await postInterClaudeMessage(addr.target, input.message)
  // Remote Control跨session消息
  // 需要用户显式同意（safetyCheck）
}
```

## 实现建议

### OpenClaw适配

1. **messageTypes**: Discriminated union
2. **address**: Multi-scheme addressing
3. **mailbox**: 文件mailbox
4. **autoResume**: Stopped agent恢复

### 状态文件示例

```json
{
  "type": "message",
  "to": "agent1",
  "scheme": "other",
  "delivered": true,
  "autoResumed": false
}
```

## 关键模式

### Discriminated Union Schema

```typescript
z.discriminatedUnion('type', [ ... ])
// TypeScript narrowing
// 每种type有特定字段
```

### Auto-resume Logic

```
Running → queue message
Stopped → resume with message
// 无缝恢复agent
```

### Safety Check for Bridge

```typescript
decisionReason: {
  type: 'safetyCheck',
  reason: 'Cross-machine bridge message requires explicit user consent',
  classifierApprovable: false
}
// Bridge需要用户同意
// 不能通过auto-mode bypass
```

## 借用价值

- ⭐⭐⭐⭐⭐ Discriminated union schema
- ⭐⭐⭐⭐⭐ Auto-resume stopped agent
- ⭐⭐⭐⭐⭐ Multi-scheme addressing
- ⭐⭐⭐⭐ Mailbox pattern
- ⭐⭐⭐⭐ Safety check for cross-machine

## 来源

- Claude Code: `tools/SendMessageTool/SendMessageTool.ts` (20KB)
- 分析报告: P38-3