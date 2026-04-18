---
name: inbox-poller
description: "Poll inbox for pending messages and tasks Use when [inbox poller] is needed."
triggers:
  - inbox
  - poll
  - messages
metadata:
  openclaw:
    source: claude-code-pattern
    category: automation
    priority: high
---

# Inbox Poller Service

借鉴 Claude Code useInboxPoller.ts，轮询收件箱。

## 核心功能

| 功能 | 说明 |
|------|------|
| pollInbox | 轮询收件箱 |
| getUnreadMessages | 获取未读 |
| getHighPriorityMessages | 获取高优先 |
| getActionRequiredMessages | 获取需行动 |
| generateInboxCard | 飞书收件箱卡片 |

## 消息类型

- task - 任务
- notification - 通知
- approval - 审批
- reminder - 提醒
- message - 消息