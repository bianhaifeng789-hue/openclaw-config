---
name: feishu-integration
description: "Feishu integration hub for OpenClaw services Use when [feishu integration] is needed."
triggers:
  - feishu
  - lark
  - integration
metadata:
  openclaw:
    source: openclaw-extension
    category: integration
    priority: high
---

# Feishu Integration Hub

飞书集成中心，统一管理所有飞书相关功能。

## 集成模块

| 模块 | 说明 |
|------|------|
| feishuDoc | 文档操作 |
| feishuChat | 聊天操作 |
| feishuWiki | 知识库操作 |
| feishuDrive | 云存储操作 |
| feishuBitable | 多维表格 |

## OpenClaw 扩展

| 模块 | 说明 |
|------|------|
| feishuCards | 卡片构建 |
| feishuNotifications | 通知服务 |
| feishuApproval | 审批交互 |

## Plugins

OpenClaw 已有飞书 Plugins：
- feishu_doc
- feishu_chat
- feishu_wiki
- feishu_drive
- feishu_bitable