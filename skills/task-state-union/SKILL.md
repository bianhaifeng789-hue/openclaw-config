# Task State Union Skill

Task State Union - 7种Task类型Union + TaskType/TaskStatus枚举 + isTerminalTaskStatus + isBackgroundTask guard。

## 功能概述

从Claude Code的Task.ts/tasks/types.ts提取的任务状态类型模式，用于OpenClaw的任务管理。

## 核心机制

### TaskType Enum

```typescript
export type TaskType =
  | 'local_bash'
  | 'local_agent'
  | 'remote_agent'
  | 'in_process_teammate'
  | 'local_workflow'
  | 'monitor_mcp'
  | 'dream'
// 7 concrete task types
// Discriminant for TaskState union
```

### TaskStatus Enum

```typescript
export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'killed'
// 5 status values
// pending/running: active
// completed/failed/killed: terminal
```

### TaskState Union

```typescript
export type TaskState =
  | LocalShellTaskState
  | LocalAgentTaskState
  | RemoteAgentTaskState
  | InProcessTeammateTaskState
  | LocalWorkflowTaskState
  | MonitorMcpTaskState
  | DreamTaskState
// Union of all concrete task state types
// Discriminated by type field
// Use for components that work with any task
```

### isTerminalTaskStatus

```typescript
/**
 * True when a task is in a terminal state and will not transition further.
 * Used to guard against injecting messages into dead teammates, evicting
 * finished tasks from AppState, and orphan-cleanup paths.
 */
export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'killed'
}
// Terminal state guard
// No further transitions
// Message injection guard
// Eviction guard
```

### isBackgroundTask

```typescript
export function isBackgroundTask(task: TaskState): task is BackgroundTaskState {
  if (task.status !== 'running' && task.status !== 'pending') {
    return false
  }
  // Foreground tasks (isBackgrounded === false) are not "background tasks"
  if ('isBackgrounded' in task && task.isBackgrounded === false) {
    return false
  }
  return true
}
// Running or pending required
// isBackgrounded === false excluded
// Type guard returns BackgroundTaskState
```

### TaskStateBase

```typescript
export type TaskStateBase = {
  id: string
  type: TaskType
  status: TaskStatus
  description: string
  toolUseId?: string
  startTime: number
  endTime?: number
  totalPausedMs?: number
  outputFile: string
  outputOffset: number
  notified: boolean
}
// Base fields for all task states
// id, type, status, description, timestamps
// outputFile for task output
```

### TASK_ID_PREFIXES

```typescript
const TASK_ID_PREFIXES: Record<string, string> = {
  local_bash: 'b',  // Keep 'b' for backward compatibility
  local_agent: 'a',
  remote_agent: 'r',
  in_process_teammate: 't',
  local_workflow: 'w',
  monitor_mcp: 'm',
  dream: 'd'
}
// Prefix per task type
// backward compatibility for local_bash = 'b'
```

## 实现建议

### OpenClaw适配

1. **taskTypeEnum**: TaskType枚举
2. **taskStatusEnum**: TaskStatus枚举
3. **taskStateUnion**: TaskState Union
4. **terminalGuard**: isTerminalTaskStatus guard
5. **backgroundGuard**: isBackgroundTask guard

### 状态文件示例

```json
{
  "taskType": "local_agent",
  "taskStatus": "running",
  "taskIdPrefix": "a",
  "isTerminal": false,
  "isBackground": true
}
```

## 关键模式

### 7-Type Union

```
TaskState = 7 concrete task types → discriminated by type field
// 7种Task类型的Union
// type字段作为discriminant
```

### Terminal Guard

```
completed | failed | killed → terminal → no further transitions
// 3种terminal状态
// 防止message injection
```

### Background Guard

```
running | pending + isBackgrounded !== false → background
// 必须running/pending
// foreground tasks排除
```

### ID Prefix Pattern

```
local_bash='b', local_agent='a', etc. → taskId prefix
// 每种type有prefix
// backward compatibility保留'b'
```

## 借用价值

- ⭐⭐⭐⭐⭐ TaskType/TaskStatus enums
- ⭐⭐⭐⭐⭐ TaskState Union pattern
- ⭐⭐⭐⭐⭐ isTerminalTaskStatus guard
- ⭐⭐⭐⭐⭐ isBackgroundTask guard
- ⭐⭐⭐⭐ TaskStateBase common fields

## 来源

- Claude Code: `Task.ts`, `tasks/types.ts`
- 分析报告: P43-1