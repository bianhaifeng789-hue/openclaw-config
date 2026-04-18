# Task Framework Skill

任务框架 - 多类型任务注册和管理。

## 功能概述

从Claude Code的tasks.ts提取的任务管理模式，用于OpenClaw的后台任务。

## 核心机制

### Task类型

```typescript
type TaskType = 'local_shell' | 'local_agent' | 'remote_agent' | 'dream' | 'workflow' | 'monitor_mcp'

const tasks: Task[] = [
  LocalShellTask,     // 本地shell命令
  LocalAgentTask,     // 本地agent
  RemoteAgentTask,    // 远程agent（CCR）
  DreamTask,          // 记忆整合
]
// Feature-gated:
if (LocalWorkflowTask) tasks.push(LocalWorkflowTask)
if (MonitorMcpTask) tasks.push(MonitorMcpTask)
```

### getAllTasks()

```typescript
export function getAllTasks(): Task[] {
  const tasks: Task[] = [
    LocalShellTask,
    LocalAgentTask,
    RemoteAgentTask,
    DreamTask,
  ]
  if (LocalWorkflowTask) tasks.push(LocalWorkflowTask)
  if (MonitorMcpTask) tasks.push(MonitorMcpTask)
  return tasks
}
```

### getTaskByType()

```typescript
export function getTaskByType(type: TaskType): Task | undefined {
  return getAllTasks().find(t => t.type === type)
}
```

### Feature-gated加载

```typescript
const LocalWorkflowTask: Task | null = feature('WORKFLOW_SCRIPTS')
  ? require('./tasks/LocalWorkflowTask/LocalWorkflowTask.js').LocalWorkflowTask
  : null
// 动态require基于feature flag
```

## 实现建议

### OpenClaw适配

1. **Task类型**: 定义OpenClaw的任务类型
2. **注册机制**: getAllTasks动态注册
3. **查找**: getTaskByType按类型查找
4. **Feature gate**: 条件加载任务

### 状态文件示例

```json
{
  "taskTypes": ["local_shell", "local_agent", "remote_agent", "dream"],
  "activeTasks": [
    { "id": "task_1", "type": "dream", "status": "running" },
    { "id": "task_2", "type": "local_agent", "status": "completed" }
  ]
}
```

## 关键模式

### Inline Array Pattern

```typescript
export function getAllTasks(): Task[] {
  const tasks: Task[] = [...]
  return tasks
}
// 每次调用返回新数组
// 避免循环依赖
// 动态feature gate
```

### Feature-gated Require

```typescript
const Task: Task | null = feature('X')
  ? require('./Task.js').Task
  : null
// 编译时feature检查
// 运行时动态加载
```

## 借用价值

- ⭐⭐⭐⭐ 任务类型管理
- ⭐⭐⭐⭐ Feature-gated加载
- ⭐⭐⭐⭐ Inline array避免循环依赖

## 来源

- Claude Code: `tasks.ts`
- 分析报告: P34-6