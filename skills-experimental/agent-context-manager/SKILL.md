---
name: agent-context-manager
description: "Agent context management using AsyncLocalStorage. SubagentContext + TeammateAgentContext. Concurrent agent isolation. Context precedence. Use when spawning agents, managing concurrent sessions, or needing context isolation."
metadata:
  openclaw:
    emoji: "🧠"
    triggers: [agent-spawn, agent-resume, concurrent-agent]
    feishuCard: true
---

# Agent Context Manager Skill - Agent Context 管理

Agent Context 管理，使用 AsyncLocalStorage 实现并发隔离。

## 为什么需要这个？

**场景**：
- Concurrent agent execution
- Context isolation
- Subagent tracking
- Teammate tracking
- Analytics attribution

**Claude Code 方案**：agentContext.ts + AsyncLocalStorage
**OpenClaw 飞书适配**：Context 管理 + 并发隔离

---

## Context Types

### SubagentContext

```typescript
interface SubagentContext {
  agentId: string           // Subagent's UUID
  parentSessionId?: string  // Team lead's session ID
  agentType: 'subagent'     // Type discriminator
  subagentName?: string     // e.g., "Explore", "Bash"
  isBuiltIn?: boolean       // Built-in vs custom
  invokingRequestId?: string // Invoker's request_id
  invocationKind?: 'spawn' | 'resume'
  invocationEmitted?: boolean
}
```

### TeammateAgentContext

```typescript
interface TeammateAgentContext {
  agentId: string           // Full agent ID (name@team)
  agentName: string         // Display name
  teamName: string          // Team name
  agentColor?: string       // UI color
  planModeRequired: boolean // Plan mode required
  parentSessionId: string   // Lead's session ID
  isTeamLead: boolean       // Is team lead
  agentType: 'teammate'     // Type discriminator
  invokingRequestId?: string
  invocationKind?: 'spawn' | 'resume'
  invocationEmitted?: boolean
}
```

---

## Functions

### 1. Get Agent Context

```typescript
function getAgentContext(): AgentContext | undefined {
  return agentContextStorage.getStore()
}
```

### 2. Run With Agent Context

```typescript
function runWithAgentContext<T>(context: AgentContext, fn: () => T): T {
  return agentContextStorage.run(context, fn)
}
```

### 3. Check In Agent Context

```typescript
function isInAgentContext(): boolean {
  return agentContextStorage.getStore() !== undefined
}
```

---

## 飞书卡片格式

### Agent Context Manager 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🧠 Agent Context Manager**\n\n---\n\n**当前 Context**：\n\n| 参数 | 值 |\n|------|------|\n| **agentId** | researcher@my-project |\n| **agentType** | teammate |\n| **teamName** | my-project |\n| **agentColor** | blue |\n| **planModeRequired** | false |\n\n---\n\n**并发隔离**：\n• AsyncLocalStorage\n• Concurrent agents don't interfere\n• Multiple agents in same process\n\n---\n\n**优先级**：\n```\n1. AsyncLocalStorage (in-process)\n2. dynamicTeamContext (tmux)\n3. Environment variables\n```"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/agent-context-state.json
{
  "contexts": [],
  "stats": {
    "totalSubagents": 0,
    "totalTeammates": 0,
    "concurrentMax": 0
  },
  "storage": {
    "type": "AsyncLocalStorage",
    "isolation": "Concurrent agents don't interfere"
  },
  "lastUpdate": "2026-04-12T00:59:00Z",
  "notes": "Agent Context Manager Skill 创建完成。等待 agent spawn 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| agentContext.ts | Skill + Context |
| SubagentContext | Subagent type |
| TeammateAgentContext | Teammate type |
| AsyncLocalStorage | Concurrent isolation |
| runWithAgentContext() | Run with context |

---

## 注意事项

1. **AsyncLocalStorage**：并发隔离
2. **Discriminator**：agentType 区分类型
3. **Priority**：AsyncLocalStorage > dynamic > env
4. **Concurrent**：多 agent 同进程不干扰
5. **Analytics**：Attribution tracking

---

## 自动启用

此 Skill 在 agent spawn 时自动创建 context。

---

## 下一步增强

- 飞书 context 同步
- Concurrent analytics
- Context debugging