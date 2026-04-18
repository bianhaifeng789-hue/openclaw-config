# Ultraplan Command Skill

高级多agent规划命令 - CCR远程规划，本地/远程执行选择。

## 功能概述

从Claude Code的ultraplan.tsx提取的高级规划模式，用于OpenClaw的复杂任务规划。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'ultraplan',
  description: '~10–30 min · Claude Code on the web drafts an advanced plan...',
  argumentHint: '<prompt>',
  isEnabled: () => USER_TYPE === 'ant',
  load: () => Promise.resolve({ call })
}
```

### Timeout配置

```typescript
ULTRAPLAN_TIMEOUT_MS = 30 * 60 * 1000  // 30分钟
// 多agent探索慢，需要长timeout
```

### 远程会话创建

```typescript
const session = await teleportToRemote({
  initialMessage: prompt,
  description: blurb || 'Refine local plan',
  model: getUltraplanModel(),  // Opus 4.6
  permissionMode: 'plan',
  ultraplan: true,
  useDefaultEnvironment: true,
})
```

### Detached Poll

```typescript
startDetachedPoll(taskId, sessionId, url, getAppState, setAppState)
// 后台轮询30分钟，不阻塞主流程
```

### Phase Tracking

```typescript
ultraplanPhase: 'running' | 'needs_input' | 'approved' | 'rejected'
// 在RemoteAgentTaskState中追踪状态
```

### Execution Target选择

```typescript
executionTarget: 'remote' | 'local'
// 用户选择在CCR执行或teleport回本地
```

### Pending Choice Dialog

```typescript
ultraplanPendingChoice: {
  plan: string,
  sessionId: string,
  taskId: string
}
// 用户选择时挂起，等待dialog处理
```

### Keyword Avoidance

Prompt中避免"ultraplan"关键词：
- CCR CLI运行keyword detection
- 裸关键词会self-trigger /ultraplan
- 使用system-reminder wrapper隐藏scaffolding

## 实现建议

### OpenClaw适配

1. **场景**: 复杂任务的远程规划
2. **timeout**: 30分钟长poll
3. **phase tracking**: 任务状态追踪
4. **choice dialog**: 用户选择交互

### 状态文件示例

```json
{
  "ultraplanSessionUrl": "https://...",
  "ultraplanPhase": "approved",
  "ultraplanPendingChoice": {
    "plan": "...",
    "sessionId": "...",
    "taskId": "..."
  }
}
```

## 关键模式

### Detached Poll

```typescript
void (async () => {
  // 30分钟poll，不阻塞主流程
  const { plan, rejectCount, executionTarget } = await pollForApprovedExitPlanMode(...)
  // 完成后通过enqueuePendingNotification通知
})()
```

### Cleanup on Error

```typescript
catch (e) {
  if (sessionId) {
    void archiveRemoteSession(sessionId).catch(...)
    // 错误后清理远程session，避免30分钟孤儿
  }
}
```

### Already Active Guard

```typescript
if (ultraplanSessionUrl || ultraplanLaunching) {
  return buildAlreadyActiveMessage(ultraplanSessionUrl)
}
// 防止重复启动
```

## 借用价值

- ⭐⭐⭐⭐ Detached poll不阻塞主流程
- ⭐⭐⭐⭐ Phase tracking实时状态更新
- ⭐⭐⭐⭐ Cleanup on error防止孤儿session
- ⭐⭐⭐ Keyword avoidance防self-trigger

## 来源

- Claude Code: `commands/ultraplan.tsx` (66KB)
- 分析报告: P34-2