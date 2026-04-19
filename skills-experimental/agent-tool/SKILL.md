# Agent Tool Skill

Agent执行工具 - Fork + Background + Worktree + Progress tracking。

## 功能概述

从Claude Code的AgentTool提取的agent执行模式，用于OpenClaw的多agent管理。

## 核心机制

### Auto-background Threshold

```typescript
function getAutoBackgroundMs(): number {
  if (isEnvTruthy('CLAUDE_AUTO_BACKGROUND_TASKS') || 
      getFeatureValue('tengu_auto_background_agents', false)) {
    return 120_000  // 2 minutes
  }
  return 0  // disabled
}
// GrowthBook gate + env override
// 长时间任务自动后台化
```

### Fork Execution

```typescript
if (context === 'fork' && isForkSubagentEnabled()) {
  const messages = buildForkedMessages(prompt, agentDefinition)
  return runForkedAgent(messages, agentDefinition, context)
}
// Fork到独立进程执行
// 避免主session阻塞
```

### Worktree Creation

```typescript
if (agentDefinition.isolation === 'worktree') {
  const worktree = await createAgentWorktree(agentId, getCwd())
  cwdOverride = worktree.path
}
// 需要isolation的agent在worktree中执行
// 避免污染主repo
```

### Progress Tracking

```typescript
const tracker = createProgressTracker(agentId)
updateAsyncAgentProgress(agentId, tracker)
// 实时进度更新
// 显示spinner状态
```

### Remote Agent Eligibility

```typescript
if (checkRemoteAgentEligibility(agentDefinition)) {
  const url = getRemoteTaskSessionUrl(agentDefinition)
  await teleportToRemote(url)
}
// 支持远程agent执行
// Cloud/Pro tier功能
```

### Async Lifecycle

```typescript
for await (const message of runAgentLifecycle(agentId, ...)) {
  emitTaskProgress(message)
  if (isComplete(message)) finalizeAgentTool(agentId)
}
// 异步迭代器管理生命周期
// 进度事件实时emit
```

## 实现建议

### OpenClaw适配

1. **autoBackground**: 长任务后台化
2. **fork**: 独立进程执行
3. **worktree**: Repo隔离
4. **progress**: 进度追踪
5. **remote**: Optional远程执行

### 状态文件示例

```json
{
  "agentId": "agent_abc",
  "status": "background",
  "progress": { "phase": "executing", "percentage": 45 },
  "worktree": "/tmp/worktree_x",
  "forked": false
}
```

## 关键模式

### Auto-background Threshold

```
Blocking → 2min → Background
// 防止UI阻塞
// 用户可继续工作
```

### Fork vs Inline

```
context='fork' → Forked execution
context='inline' → Main session
// 根据需要选择执行模式
```

### Worktree Isolation

```
isolation='worktree' → Create worktree
// 独立repo状态
// 避免冲突
```

## 借用价值

- ⭐⭐⭐⭐⭐ Auto-background threshold
- ⭐⭐⭐⭐⭐ Fork vs inline execution
- ⭐⭐⭐⭐⭐ Worktree isolation
- ⭐⭐⭐⭐⭐ Progress tracking lifecycle
- ⭐⭐⭐⭐ Remote agent support

## 来源

- Claude Code: `tools/AgentTool/AgentTool.tsx` (50KB+)
- 分析报告: P38-6