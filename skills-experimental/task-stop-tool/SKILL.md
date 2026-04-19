# Task Stop Tool Skill

任务停止工具 - Alias backward compat + Status validation + User-facing conditional。

## 功能概述

从Claude Code的TaskStopTool提取的后台任务停止模式，用于OpenClaw的后台任务管理。

## 核心机制

### Alias Backward Compatibility

```typescript
aliases: ['KillShell']
// KillShell是deprecated name
// 兼容旧transcripts和SDK
// task_id和shell_id都支持
```

### Status Validation

```typescript
const task = appState.tasks?.[id]
if (!task) {
  return { result: false, message: `No task found with ID: ${id}`, errorCode: 1 }
}
if (task.status !== 'running') {
  return { result: false, message: `Task ${id} is not running (status: ${task.status})`, errorCode: 3 }
}
// 只能stop running状态的任务
// 其他状态拒绝
```

### User-facing Conditional

```typescript
userFacingName: () => (process.env.USER_TYPE === 'ant' ? '' : 'Stop Task')
// ant用户隐藏name
// 其他用户显示'Stop Task'
```

### Optional Field Backward Compat

```typescript
command: z.string().optional().describe('The command of stopped task')
// Optional: transcripts replayed on --resume without re-validation
// Sessions before this field added lack it
// Optional兼容旧transcripts
```

### Stop Task Result

```typescript
const result = await stopTask(id, { getAppState, setAppState })
return {
  data: {
    message: `Successfully stopped task: ${result.taskId} (${result.command})`,
    task_id: result.taskId,
    task_type: result.taskType,
    command: result.command
  }
}
// 包含task_type
// 用户友好消息
```

## 实现建议

### OpenClaw适配

1. **alias**: Alias兼容
2. **statusValidation**: 状态验证
3. **userFacing**: User-facing条件
4. **optionalCompat**: Optional兼容

### 状态文件示例

```json
{
  "taskId": "task-123",
  "taskType": "bash",
  "command": "npm run build",
  "status": "stopped",
  "aliasUsed": false
}
```

## 关键模式

### Alias Pattern

```
aliases: ['DeprecatedName'] → backward compat
// 旧名称兼容
// SDK平滑迁移
```

### Status Gate

```
task.status === 'running' → allow stop
其他 → reject
// 只能停止running任务
```

### User-type Conditional

```
USER_TYPE === 'ant' → hide name
其他 → show name
// 按用户类型定制UI
```

### Optional Field Evolution

```
新field → optional → compat old transcripts
// 渐进添加field
// 不break旧sessions
```

## 借用价值

- ⭐⭐⭐⭐ Alias backward compat pattern
- ⭐⭐⭐⭐ Status validation gate
- ⭐⭐⭐⭐ User-type conditional
- ⭐⭐⭐⭐ Optional field evolution

## 来源

- Claude Code: `tools/TaskStopTool/TaskStopTool.ts` (4KB)
- 分析报告: P38-24