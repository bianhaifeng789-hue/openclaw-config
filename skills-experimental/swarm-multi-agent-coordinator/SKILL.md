---
name: swarm-multi-agent-coordinator
description: |
  Coordinate multiple agents in swarm/team mode for parallel task execution.
  
  Use when:
  - User explicitly asks "spawn multiple agents" or "parallel execution"
  - Complex task needs delegation to specialized agents
  - User says "coordinate team" or "swarm mode"
  - Multiple subtasks can run independently
  
  NOT for:
  - Single agent scenarios
  - Simple tasks (no need for parallel)
  - Dependent subtasks (need sequential)
  - User didn't request multi-agent
  
  Auto-trigger conditions:
  - User explicitly enables swarm mode
  - Task complexity requires delegation
  
  Swarm architecture:
  - Leader: Primary coordinator, handles permissions
  - Teammates: Forked agents, specialized tasks
  - PermissionBridge: Leader→Teammate permission sync
  - Reconnection: Handle teammate disconnects
  
  Keywords (require explicit mention):
  - "swarm", "parallel agents", "team", "多agent", "并行执行"
metadata:
  openclaw:
    emoji: "🐝"
    source: claude-code-core
    triggers: [explicit-request]
    priority: P0
    autoTrigger: false
    feishuCard: true
---

# Swarm Multi-Agent Coordinator

多Agent协作协调器。

## 架构组件

### Leader（领导者）
- 主协调Agent
- 处理权限请求
- 同步队友状态
- 收集结果

### Teammate（队友）
- Forked subagent
- 专门化任务执行
- 独立上下文
- 结果汇报

### PermissionBridge
- 领导者→队友权限同步
- 避免重复询问
- 权限传递机制

### Reconnection
- 队友断连恢复
- 状态持久化
- 任务继续

## 实现示例

```typescript
// Leader初始化swarm
const swarm = await initSwarm({
  leaderId: 'main-agent',
  teammates: [
    { role: 'code-writer', model: 'coding-model' },
    { role: 'tester', model: 'test-model' },
    { role: 'reviewer', model: 'review-model' }
  ],
  permissionBridge: leaderPermissionBridge,
})

// 分配任务
swarm.delegate({
  task: 'Write unit tests',
  to: 'tester',
  context: { files: ['src/utils.ts'] }
})

// 收集结果
const results = await swarm.collectResults()
```

## OpenClaw适配

使用 `sessions_spawn` 实现：
```typescript
await sessions_spawn({
  runtime: 'acp',
  task: 'Execute subtask',
  thread: true
})
```

---

来源: Claude Code utils/swarm/ (12 files)