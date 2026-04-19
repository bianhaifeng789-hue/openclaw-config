---
name: task-tracker
description: "Task tracking and progress visualization Use when [task tracker] is needed."
triggers:
  - task
  - progress
  - tracker
metadata:
  openclaw:
    source: claude-code-pattern
    category: monitoring
    priority: high
---

# Task Tracker Service

任务追踪和进度可视化服务。

## 核心功能

| 功能 | 说明 |
|------|------|
| startTask | 开始任务 |
| updateProgress | 更新进度 |
| completeTask | 完成任务 |
| generateTaskCard | 飞书任务卡片 |

## 使用示例

```typescript
import { taskTracker } from './task-tracker.js'

taskTracker.startTask('analysis', '正在分析...')
taskTracker.updateProgress('analysis', 50)
taskTracker.completeTask('analysis')
```