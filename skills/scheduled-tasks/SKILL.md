---
name: scheduled-tasks
description: "Manage scheduled and recurring tasks Use when [scheduled tasks] is needed."
triggers:
  - scheduled
  - cron
  - recurring
  - timer
metadata:
  openclaw:
    source: claude-code-pattern
    category: automation
    priority: high
---

# Scheduled Tasks Service

借鉴 Claude Code useScheduledTasks.ts，定时任务管理。

## 核心功能

| 功能 | 说明 |
|------|------|
| createTask | 创建定时任务 |
| checkDueTasks | 检查到期任务 |
| runTask | 运行任务 |
| generateScheduledTasksCard | 飞书定时卡片 |

## 任务类型

| 类型 | 说明 |
|------|------|
| reminder | 提醒 |
| recurring | 周期任务 |
| one-time | 一次性 |
| cron | Cron 表达式 |

## 调度格式

支持:
- "1h" - 1小时后
- "30m" - 30分钟后
- "daily" - 每天
- "hourly" - 每小时