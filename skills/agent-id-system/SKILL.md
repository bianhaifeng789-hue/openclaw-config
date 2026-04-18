---
name: agent-id-system
description: "Deterministic agent ID system. Agent IDs (agentName@teamName). Request IDs (requestType-timestamp@agentId). formatAgentId/parseAgentId. @ separator. Use when [agent id system] is needed."
metadata:
  openclaw:
    emoji: "🆔"
    triggers: [agent-creation, agent-tracking]
    feishuCard: true
---

# Agent ID System Skill - Agent ID 系统

确定性 Agent ID 系统，用于 agent tracking。

## 为什么需要这个？

**场景**：
- Deterministic agent IDs
- Agent tracking
- Request IDs
- Message routing
- Crash recovery

**Claude Code 方案**：agentId.ts + Deterministic IDs
**OpenClaw 飞书适配**：ID 系统 + Agent tracking

---

## ID 格式

### Agent IDs

```
Format: agentName@teamName
Example: team-lead@my-project, researcher@my-project
Separator: @ (must NOT contain @ in agent name)
```

### Request IDs

```
Format: {requestType}-{timestamp}@{agentId}
Example: shutdown-1702500000000@researcher@my-project
```

---

## Functions

### 1. Format Agent ID

```typescript
function formatAgentId(agentName: string, teamName: string): string {
  return `${agentName}@${teamName}`
}
```

### 2. Parse Agent ID

```typescript
function parseAgentId(
  agentId: string
): { agentName: string; teamName: string } | null {
  const atIndex = agentId.indexOf('@')
  if (atIndex === -1) return null
  
  return {
    agentName: agentId.slice(0, atIndex),
    teamName: agentId.slice(atIndex + 1)
  }
}
```

### 3. Generate Request ID

```typescript
function generateRequestId(requestType: string, agentId: string): string {
  const timestamp = Date.now()
  return `${requestType}-${timestamp}@${agentId}`
}
```

### 4. Parse Request ID

```typescript
function parseRequestId(
  requestId: string
): { requestType: string; timestamp: number; agentId: string } | null {
  const atIndex = requestId.indexOf('@')
  if (atIndex === -1) return null
  
  const prefix = requestId.slice(0, atIndex)
  const agentId = requestId.slice(atIndex + 1)
  
  const lastDashIndex = prefix.lastIndexOf('-')
  if (lastDashIndex === -1) return null
  
  const requestType = prefix.slice(0, lastDashIndex)
  const timestamp = parseInt(prefix.slice(lastDashIndex + 1), 10)
  
  if (isNaN(timestamp)) return null
  
  return { requestType, timestamp, agentId }
}
```

---

## 飞书卡片格式

### Agent ID System 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🆔 Agent ID System**\n\n---\n\n**Agent IDs**：\n```\nFormat: agentName@teamName\nExample: researcher@my-project\nSeparator: @ (禁用 @ in agent name)\n```\n\n---\n\n**Request IDs**：\n```\nFormat: requestType-timestamp@agentId\nExample: shutdown-1702500000000@researcher@my-project\n```\n\n---\n\n**优势**：\n• **Reproducibility** - 相同 name/team = 相同 ID\n• **Human-readable** - 可读可调试\n• **Predictable** - 无需 lookup\n• **Crash recovery** - 可重连"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/agent-id-system-state.json
{
  "agents": {},
  "stats": {
    "totalAgents": 0,
    "totalRequests": 0
  },
  "format": {
    "agentId": "agentName@teamName",
    "requestId": "requestType-timestamp@agentId",
    "separator": "@"
  },
  "lastUpdate": "2026-04-12T00:59:00Z",
  "notes": "Agent ID System Skill 创建完成。等待 agent creation 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| agentId.ts | Skill + IDs |
| formatAgentId() | Format agent ID |
| parseAgentId() | Parse agent ID |
| generateRequestId() | Generate request ID |
| @ separator | Separator |

---

## 注意事项

1. **@ separator**：Agent name 禁用 @
2. **Deterministic**：相同 name/team = 相同 ID
3. **Human-readable**：可读可调试
4. **Predictable**：无需 lookup
5. **Crash recovery**：可重连

---

## 自动启用

此 Skill 在创建 agent 时自动生成 ID。

---

## 下一步增强

- 飞书 ID 验证
- ID analytics
- Crash recovery