---
name: rate-limit-messages
description: "API rate limit monitoring and notifications Use when [rate limit messages] is needed."
triggers:
  - rate_limit
  - api_limit
  - usage_monitor
metadata:
  openclaw:
    source: claude-code-pattern
    category: monitoring
    priority: high
---

# Rate Limit Messages Service

借鉴 Claude Code rateLimitMessages.ts，监控 API 使用量和限速状态。

## 核心功能

| 功能 | 说明 |
|------|------|
| updateLimit | 更新限速信息 |
| shouldNotify | 是否需要通知 |
| generateRateLimitCard | 飞书限速卡片 |

## 限速类型

| 类型 | 说明 |
|------|------|
| session | 会话限制 |
| daily | 日限制 |
| weekly | 周限制 |
| monthly | 月限制 |
| custom | 自定义限制 |

## 限速状态

| 状态 | 说明 |
|------|------|
| ok | 正常 |
| warning | 接近限制 |
| limited | 受限 |
| exhausted | 耗尽 |

## 预警阈值

- Warning: 70%
- Critical: 90%

## 飞书卡片

包含：
- 耗尽/警告/正常数量
- 各限速项使用率
- 最新消息和建议操作
- 检查统计

## 使用示例

```typescript
import { rateLimitMessagesService } from './rate-limit-messages-service.js'

// 更新限速信息
rateLimitMessagesService.updateLimit('claude-api', {
  type: 'daily',
  status: 'warning',
  used: 80,
  limit: 100,
  utilization: 0.8,
  resetsAt: new Date(Date.now() + 3600000)
})

// 检查是否需要通知
if (rateLimitMessagesService.shouldNotify()) {
  const card = rateLimitMessagesService.generateRateLimitCard()
  message({ action: 'send', card })
}
```

## 来源

借鉴 Claude Code services/rateLimitMessages.ts