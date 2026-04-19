# Task Update Tool Skill

任务更新工具 - Hook execution + Mailbox notify + Auto-owner + Verification nudge。

## 功能概述

从Claude Code的TaskUpdateTool提取的任务管理模式，用于OpenClaw的任务系统。

## 核心机制

### TaskCompleted Hooks

```typescript
if (status === 'completed') {
  const generator = executeTaskCompletedHooks(taskId, subject, description, ...)
  for await (const result of generator) {
    if (result.blockingError) {
      blockingErrors.push(getTaskCompletedHookMessage(result.blockingError))
    }
  }
  if (blockingErrors.length > 0) {
    return { success: false, error: blockingErrors.join('\n') }
  }
}
// completed状态触发hooks
// blockingError阻止完成
```

### Mailbox Notify

```typescript
if (updates.owner && isAgentSwarmsEnabled()) {
  const assignmentMessage = JSON.stringify({
    type: 'task_assignment',
    taskId,
    subject,
    assignedBy: senderName,
    timestamp: new Date().toISOString()
  })
  await writeToMailbox(updates.owner, {
    from: senderName,
    text: assignmentMessage,
    color: senderColor
  }, taskListId)
}
// Owner变更 → mailbox通知
// Teammate接收任务分配
```

### Auto-owner Assignment

```typescript
if (isAgentSwarmsEnabled() && status === 'in_progress' && owner === undefined && !existingTask.owner) {
  const agentName = getAgentName()
  if (agentName) {
    updates.owner = agentName
    updatedFields.push('owner')
  }
}
// in_progress + 无owner → 自动设置当前agent
// 确保任务列表匹配teammate
```

### Metadata Merge/Delete

```typescript
const merged = { ...(existingTask.metadata ?? {}) }
for (const [key, value] of Object.entries(metadata)) {
  if (value === null) {
    delete merged[key]  // null = delete
  } else {
    merged[key] = value  // merge
  }
}
// null删除key
// 其他值merge
```

### Delete via Status

```typescript
if (status === 'deleted') {
  const deleted = await deleteTask(taskListId, taskId)
  return {
    success: deleted,
    updatedFields: deleted ? ['deleted'] : [],
    statusChange: { from: existingTask.status, to: 'deleted' }
  }
}
// 'deleted'是特殊status
// 删除任务文件
```

### Block/BlockedBy

```typescript
// Add blocks
if (addBlocks && addBlocks.length > 0) {
  const newBlocks = addBlocks.filter(id => !existingTask.blocks.includes(id))
  for (const blockId of newBlocks) {
    await blockTask(taskListId, taskId, blockId)
  }
}

// Add blockedBy (reverse: blocker blocks this task)
if (addBlockedBy && addBlockedBy.length > 0) {
  for (const blockerId of addBlockedBy) {
    await blockTask(taskListId, blockerId, taskId)  // blockerId blocks taskId
  }
}
// 双向block关系
// addBlockedBy反向设置
```

### Auto-expand View

```typescript
context.setAppState(prev => {
  if (prev.expandedView === 'tasks') return prev
  return { ...prev, expandedView: 'tasks' }
})
// 更新任务时自动展开tasks view
// UI状态同步
```

### Verification Nudge (V2)

```typescript
if (feature('VERIFICATION_AGENT') && updates.status === 'completed') {
  const allTasks = await listTasks(taskListId)
  const allDone = allTasks.every(t => t.status === 'completed')
  if (allDone && allTasks.length >= 3 && !allTasks.some(t => /verif/i.test(t.subject))) {
    verificationNudgeNeeded = true
  }
}
// V2版本的verification nudge
// 与TodoWriteTool一致
```

### Completion Reminder

```typescript
if (statusChange?.to === 'completed' && getAgentId() && isAgentSwarmsEnabled()) {
  resultContent += '\n\nTask completed. Call TaskList now to find your next task.'
}
// Teammate完成任务 → 提示调用TaskList
// 找下一个任务
```

## 实现建议

### OpenClaw适配

1. **hooks**: Completed hooks
2. **mailbox**: Owner变更通知
3. **autoOwner**: 自动owner设置
4. **metadataMerge**: Metadata merge/delete
5. **blocks**: Block/blockedBy关系

### 状态文件示例

```json
{
  "taskId": "5",
  "statusChange": { "from": "in_progress", "to": "completed" },
  "updatedFields": ["status", "owner"],
  "hooksExecuted": true,
  "mailboxNotified": true,
  "autoOwner": true
}
```

## 关键模式

### Completed Hook Pattern

```
status='completed' → executeTaskCompletedHooks → blockingError → reject
// Hook阻止完成
// 业务规则验证
```

### Mailbox Assignment

```
owner update → writeToMailbox → teammate receives notification
// 任务分配通知
// 多agent协作
```

### Null = Delete Pattern

```
metadata[key] = null → delete key
// Null作为删除标记
// Merge语义
```

### Auto-owner Logic

```
in_progress + no owner + swarms enabled → set current agent as owner
// 自动归属
// 任务列表匹配
```

## 借用价值

- ⭐⭐⭐⭐⭐ Hook execution pattern
- ⭐⭐⭐⭐⭐ Mailbox notify pattern
- ⭐⭐⭐⭐⭐ Auto-owner assignment
- ⭐⭐⭐⭐ Metadata null = delete
- ⭐⭐⭐⭐ Block/blockedBy reverse

## 来源

- Claude Code: `tools/TaskUpdateTool/TaskUpdateTool.ts` (12KB+)
- 分析报告: P38-22