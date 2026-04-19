---
name: task-list-watcher
description: "Watch task directory and auto-pick up unassigned tasks Use when [task list watcher] is needed."
triggers:
  - task_watcher
  - auto_task
  - task_queue
metadata:
  openclaw:
    source: claude-code-pattern
    category: automation
    priority: high
---

# Task List Watcher Service

借鉴 Claude Code useTaskListWatcher.ts，监控任务目录自动拾取任务。

## 核心功能

| 功能 | 说明 |
|------|------|
| initTasksDir | 初始化任务目录 |
| listTasks | 列出所有任务 |
| getNextTask | 获取下一个待处理 |
| claimTask | 认领任务 |
| completeTask | 完成任务 |
| createTask | 创建新任务 |

## 任务状态

| 状态 | 目录 |
|------|------|
| open | tasks/open/ |
| in_progress | tasks/in_progress/ |
| completed | tasks/completed/ |
| cancelled | tasks/cancelled/ |

## 使用示例

```typescript
import { taskListWatcherService } from './task-list-watcher-service.js'

// 初始化
await taskListWatcherService.initTasksDir()

// 创建任务
const task = await taskListWatcherService.createTask('分析项目', 'high')

// 自动拾取
const next = await taskListWatcherService.getNextTask('agent-1')
if (next) await taskListWatcherService.claimTask(next.id, 'agent-1')
```