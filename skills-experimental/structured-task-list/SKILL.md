---
name: structured-task-list
description: "Structured task list for coding sessions. Task fields (subject/description/activeForm/metadata). Task dependencies (blocks/blockedBy). Teammate assignment. Use when [structured task list] is needed."
metadata:
  openclaw:
    emoji: "📋"
    triggers: [task-create, task-update]
    feishuCard: true
---

# Structured Task List Skill - 结构化任务列表

结构化任务列表，用于编码会话。

## 为什么需要这个？

**场景**：
- 多步骤任务追踪
- 任务进度展示
- 任务依赖管理
- Teammate 分配
- 组织复杂任务

**Claude Code 方案**：TaskCreateTool + Structured fields
**OpenClaw 飞书适配**：任务列表 + 进度展示

---

## 任务字段

```typescript
interface Task {
  id: string
  subject: string          // Brief title (imperative form)
  description: string      // What needs to be done
  activeForm?: string      // Present continuous for spinner
  status: 'pending' | 'in_progress' | 'completed'
  owner?: string           // Teammate assignment
  blocks: string[]         // Tasks this blocks
  blockedBy: string[]      // Tasks blocking this
  metadata?: Record<string, unknown>
}
```

---

## Functions

### 1. Create Task

```typescript
async function createTask(taskListId: string, task: TaskInput): Promise<string> {
  const taskId = await createTask(taskListId, {
    subject: task.subject,
    description: task.description,
    activeForm: task.activeForm,
    status: 'pending',
    owner: undefined,
    blocks: [],
    blockedBy: [],
    metadata: task.metadata
  })
  
  // Execute hooks
  await executeTaskCreatedHooks(
    taskId,
    task.subject,
    task.description,
    getAgentName(),
    getTeamName()
  )
  
  return taskId
}
```

### 2. Update Task

```typescript
async function updateTask(taskId: string, updates: TaskUpdate): Promise<void> {
  // Update fields
  // - status: pending → in_progress → completed
  // - owner: assign to teammate
  // - blocks/blockedBy: set dependencies
}
```

---

## 飞书卡片格式

### Task List 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📋 Task List**\n\n---\n\n**任务进度**：\n\n| 任务 | 状态 | Owner |\n|------|------|------|\n| Fix auth bug | ✓ completed | - |\n| Update tests | ⏳ in_progress | researcher |\n| Refactor API | ⏸ pending | - |\n\n---\n\n**依赖关系**：\n```\nRefactor API → Update tests\n  (blockedBy)\n```\n\n---\n\n**统计**：\n• Total: 3\n• Completed: 1\n• In progress: 1\n• Pending: 1"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/structured-task-state.json
{
  "tasks": [],
  "stats": {
    "total": 0,
    "completed": 0,
    "inProgress": 0,
    "pending": 0
  },
  "dependencies": [],
  "lastUpdate": "2026-04-12T00:50:00Z",
  "notes": "Structured Task List Skill 创建完成。等待 task create 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| TaskCreateTool | Skill + List |
| subject | 标题（命令式） |
| description | 详细描述 |
| activeForm | Spinner 显示 |
| blocks/blockedBy | 依赖管理 |

---

## 注意事项

1. **Imperative form**：subject 使用命令式
2. **Present continuous**：activeForm 用于 spinner
3. **Dependencies**：blocks/blockedBy 管理依赖
4. **Teammate**：owner 分配给 teammate
5. **Hooks**：executeTaskCreatedHooks

---

## 自动启用

此 Skill 在创建/更新任务时自动运行。

---

## 下一步增强

- 飞书任务卡片
- 进度可视化
- 依赖图展示