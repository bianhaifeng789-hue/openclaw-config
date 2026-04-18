---
name: feishu-interaction
description: "Handle Feishu interactive card callbacks Use when [feishu interaction] is needed."
triggers:
  - feishu_callback
  - interaction
  - approval_callback
metadata:
  openclaw:
    source: openclaw-extension
    category: ui
    priority: high
---

# Feishu Interaction Handler

处理飞书交互卡片回调（审批、确认等）。

## 核心功能

| 功能 | 说明 |
|------|------|
| handleApprovalCallback | 处理审批回调 |
| handleInteractionCallback | 处理通用回调 |
| getServerApprovalStatus | 获取服务器审批状态 |
| generateInteractionCard | 飞书交互卡片 |

## 交互类型

| 类型 | 说明 |
|------|------|
| approve | 审批通过 |
| deny | 审批拒绝 |
| confirm | 确认操作 |
| cancel | 取消操作 |
| select | 选择项 |
| input | 输入文本 |

## 使用示例

```typescript
import { feishuInteractionService } from './feishu-interaction-handler.js'

// 处理审批回调
const result = feishuInteractionService.handleApprovalCallback(
  'github-mcp',
  'approve',
  'Trusted server'
)

// 生成交互卡片
const card = feishuInteractionService.generateInteractionCard()
```