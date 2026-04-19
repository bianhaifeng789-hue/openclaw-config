---
name: smart-dispatcher
description: "Intelligent service dispatcher with scene detection Use when [smart dispatcher] is needed."
triggers:
  - dispatch
  - smart
  - scene
metadata:
  openclaw:
    source: claude-code-pattern
    category: orchestration
    priority: high
---

# Smart Dispatcher

智能服务调度器，自动检测场景并调用相应服务。

## 核心功能

| 功能 | 说明 |
|------|------|
| detectScene | 检测当前场景 |
| smartDispatch | 自动调用服务 |
| getServiceForScene | 获取场景对应服务 |

## 场景类型

- feishu_chat
- code_edit
- memory_maintenance
- diagnostic_check