---
name: internal-logging
description: "Internal logging with environment tracking Use when [internal logging] is needed."
triggers:
  - internal_log
  - system_log
  - logging
metadata:
  openclaw:
    source: claude-code-pattern
    category: monitoring
    priority: medium
---

# Internal Logging Service

借鉴 Claude Code internalLogging.ts，记录内部日志和环境信息。

## 核心功能

| 功能 | 说明 |
|------|------|
| log | 记录日志（通用） |
| logDebug/info/warn/error | 快捷方法 |
| getEnvironmentInfo | 获取环境信息 |
| generateLogCard | 飞书日志卡片 |
| exportLogs | 导出日志到文件 |

## 环境信息

- platform (macos/linux/windows)
- nodeVersion
- hostname
- homedir
- userType

## 飞书卡片

包含：
- 总日志数、错误数、警告数
- 最近错误列表
- 最近警告列表
- 环境信息

## 使用示例

```typescript
import { internalLoggingService } from './internal-logging-service.js'

// 记录日志
internalLoggingService.logError('api', 'Request failed', { code: 500 })
internalLoggingService.logInfo('heartbeat', 'Check completed')

// 生成飞书卡片
const card = internalLoggingService.generateLogCard()

// 导出日志
await internalLoggingService.exportLogs('/path/to/logs.txt')
```

## 来源

借鉴 Claude Code services/internalLogging.ts