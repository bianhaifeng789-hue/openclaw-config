---
name: background-task-navigation
description: "Navigate between background tasks with keyboard shortcuts Use when [background task navigation] is needed."
triggers:
  - task_navigation
  - background_task
  - task_view
metadata:
  openclaw:
    source: claude-code-pattern
    category: ui
    priority: high
---

# Background Task Navigation Service

借鉴 Claude Code useBackgroundTaskNavigation.ts，后台任务导航管理。

## 核心功能

| 功能 | 说明 |
|------|------|
| addTask | 添加后台任务 |
| updateTaskStatus | 更新状态 |
| getRunningTasks | 获取运行中 |
| navigateNext/Prev | 导航切换 |
| generateNavigationCard | 飞书导航卡片 |

## 任务类型

| 类型 | 说明 |
|------|------|
| local_agent | 本地子代理 |
| local_bash | 本地 Bash |
| remote_agent | 远程代理 |
| scheduled | 定时任务 |
| swarm | Swarm 任务 |

## 飞书卡片交互

包含三个按钮：
- 上一个
- 下一个
- 收起