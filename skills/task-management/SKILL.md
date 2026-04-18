---
name: task-management
description: "Task management with Zod schema. TaskSchema/TaskStatusSchema + TASK_STATUSES (pending/in_progress/completed) + createTask/updateTask/deleteTask + High water mark + File locking (retries=30) + tasksUpdated signal. Use when [task management] is needed."
metadata:
  openclaw:
    emoji: "📋"
    triggers: [task-create, task-update]
    feishuCard: true
---

# Task Management Skill - Task Management

Task Management 任务管理工具。

## 为什么需要这个？

**场景**：
- Task CRUD operations
- Task status management
- High water mark for IDs
- File locking for concurrency
- Task update notifications

**Claude Code 方案**：tasks.ts + 864+ lines
**OpenClaw 飞书适配**：Task management + Task schema

---

## Constants

```typescript
const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const
const HIGH_WATER_MARK_FILE = '.highwatermark'
const MAX_WORKTREE_SLUG_LENGTH = 64

const LOCK_OPTIONS = {
  retries: {
    retries: 30,
    minTimeout: 5,
    maxTimeout: 100,
  },
}
```

---

## Types

### Task Status

```typescript
type TaskStatus = 'pending' | 'in_progress' | 'completed'
```

### Task

```typescript
type Task = {
  id: string
  subject: string
  description: string
  activeForm?: string    // present continuous for spinner
  owner?: string         // agent ID
  status: TaskStatus
  blocks: string[]       // task IDs this task blocks
  blockedBy: string[]    // task IDs that block this task
  metadata?: Record<string, unknown>
}
```

---

## Functions

### 1. Create Task

```typescript
async function createTask(
  taskListId: string,
  task: Omit<Task, 'id'>,
): Promise<Task> {
  // Use lock to prevent race conditions
  // Read high water mark
  // Increment and write
  // Write task file
  // Notify subscribers
}
```

### 2. Update Task

```typescript
async function updateTask(
  taskListId: string,
  taskId: string,
  updates: Partial<Task>,
): Promise<Task> {
  // Read task file
  // Apply updates
  // Write task file
  // Notify subscribers
}
```

### 3. Delete Task

```typescript
async function deleteTask(
  taskListId: string,
  taskId: string,
): Promise<void> {
  // Delete task file
  // Notify subscribers
}
```

---

## Signal

```typescript
const tasksUpdated = createSignal()

function notifyTasksUpdated(): void {
  try {
    tasksUpdated.emit()
  } catch {
    // Ignore listener errors
  }
}

const onTasksUpdated = tasksUpdated.subscribe
```

---

## 飞书卡片格式

### Task Management 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📋 Task Management**\n\n---\n\n**Task Status**：\n• pending\n• in_progress\n• completed\n\n---\n\n**Task Schema**：\n```typescript\n{\n  id: string,\n  subject: string,\n  description: string,\n  status: TaskStatus,\n  blocks: string[],\n  blockedBy: string[]\n}\n```\n\n---\n\n**Functions**：\n• createTask()\n• updateTask()\n• deleteTask()\n\n---\n\n**Features**：\n• High water mark\n• File locking (retries=30)\n• tasksUpdated signal"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/task-management-state.json
{
  "tasks": [],
  "stats": {
    "totalCreated": 0,
    "totalUpdated": 0,
    "totalDeleted": 0
  },
  "lastUpdate": "2026-04-12T10:42:00Z",
  "notes": "Task Management Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| tasks.ts (864+ lines) | Skill + Task |
| TaskSchema | Zod schema |
| TASK_STATUSES | Status enum |
| tasksUpdated | Signal |

---

## 注意事项

1. **Zod schema**：TaskSchema/TaskStatusSchema
2. **High water mark**：Prevent ID reuse
3. **File locking**：retries=30 for concurrency
4. **Signal**：tasksUpdated for notifications
5. **blocks/blockedBy**：Task dependencies

---

## 自动启用

此 Skill 在 task operation 时自动运行。

---

## 下一步增强

- 飞书 task 集成
- Task analytics
- Task debugging