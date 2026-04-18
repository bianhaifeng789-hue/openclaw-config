# Task Create Tool Skill

任务创建工具 - Hook执行 + Auto-expand UI + Error rollback。

## 功能概述

从Claude Code的TaskCreateTool提取的任务创建模式，用于OpenClaw的待办管理。

## 核心机制

### Schema定义

```typescript
inputSchema: z.strictObject({
  subject: z.string().describe('A brief title'),
  description: z.string().describe('What needs to be done'),
  activeForm: z.string().optional().describe('Spinner text'),
  metadata: z.record(z.string(), z.unknown()).optional()
})

outputSchema: z.object({
  task: z.object({
    id: z.string(),
    subject: z.string()
  })
})
```

### Hook执行

```typescript
const generator = executeTaskCreatedHooks(
  taskId, subject, description,
  getAgentName(), getTeamName()
)
for await (const result of generator) {
  if (result.blockingError) {
    blockingErrors.push(getTaskCreatedHookMessage(result.blockingError))
  }
}
// 创建后执行hooks
// Blocking errors需要rollback
```

### Error Rollback

```typescript
if (blockingErrors.length > 0) {
  await deleteTask(getTaskListId(), taskId)
  throw new Error(blockingErrors.join('\n'))
}
// Hook blocking → delete task
// 避免脏数据
```

### Auto-expand UI

```typescript
context.setAppState(prev => {
  if (prev.expandedView === 'tasks') return prev
  return { ...prev, expandedView: 'tasks' }
})
// 创建任务自动展开列表
// 用户立即看到
```

## 实现建议

### OpenClaw适配

1. **schema**: Zod strict object
2. **hooks**: TaskCreated hooks
3. **rollback**: Error删除任务
4. **ui**: Auto-expand

### 状态文件示例

```json
{
  "task": { "id": "task_123", "subject": "Fix bug" },
  "hooksExecuted": true,
  "autoExpanded": true
}
```

## 关键模式

### Hook Generator

```typescript
for await (const result of generator)
// 异步迭代器处理hooks
// 支持blocking/non-blocking
```

### Rollback on Failure

```
Create → Hook → Error → Delete
// 避免部分成功状态
```

## 借用价值

- ⭐⭐⭐⭐ Hook generator pattern
- ⭐⭐⭐⭐ Error rollback
- ⭐⭐⭐ Auto-expand UI

## 来源

- Claude Code: `tools/TaskCreateTool/TaskCreateTool.ts`
- 分析报告: P38-1