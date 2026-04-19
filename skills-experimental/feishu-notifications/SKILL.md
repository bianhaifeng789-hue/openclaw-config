---
name: feishu-notifications
description: "Feishu notification service for OpenClaw Use when [feishu notifications] is needed."
triggers:
  - notify
  - feishu_notify
  - alert
metadata:
  openclaw:
    source: openclaw-extension
    category: communication
    priority: high
---

# Feishu Notifications

飞书通知服务，用于发送各类通知卡片。

## 核心功能

| 功能 | 说明 |
|------|------|
| sendTaskCard | 发送任务卡片 |
| sendDiagnosticCard | 发送诊断卡片 |
| sendRateLimitCard | 发送限速卡片 |
| sendApprovalCard | 发送审批卡片 |
| sendLogCard | 发送日志卡片 |

## 通知类型

- **高优先级**：错误、限速、审批
- **中优先级**：诊断、进度
- **低优先级**：日志、统计

## 使用示例

```typescript
import { feishuNotifications } from './feishu-notifications.js'

// 发送限速警告
feishuNotifications.sendRateLimitCard({
  type: 'daily',
  utilization: 0.85,
  resetsAt: new Date()
})
```