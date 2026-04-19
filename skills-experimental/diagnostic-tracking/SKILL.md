---
name: diagnostic-tracking
description: "Track file diagnostics before/after edits Use when [diagnostic tracking] is needed."
triggers:
  - diagnostic
  - error_tracking
  - diagnostics
metadata:
  openclaw:
    source: claude-code-pattern
    category: monitoring
    priority: high
---

# Diagnostic Tracking Service

借鉴 Claude Code diagnosticTracking.ts，追踪文件编辑前后诊断变化。

## 核心功能

| 功能 | 说明 |
|------|------|
| beforeFileEdited | 编辑前记录诊断基线 |
| addNewDiagnostics | 编辑后添加新诊断 |
| getNewDiagnostics | 获取新增诊断 |
| generateDiagnosticCard | 飞书诊断卡片 |

## 诊断类型

- Error ❌
- Warning ⚠️
- Info ℹ️
- Hint 💡

## 飞书卡片

包含：
- 错误/警告/信息数量
- 文件列表
- 详细诊断信息

## 使用示例

```typescript
import { diagnosticTrackingService } from './diagnostic-tracking-service.js'

// 编辑前
diagnosticTrackingService.beforeFileEdited('/path/to/file.ts', [])

// 编辑后（假设有新错误）
diagnosticTrackingService.addNewDiagnostics('/path/to/file.ts', [
  { message: 'Type error', severity: 'Error', range: { start: { line: 10, character: 5 }, end: { line: 10, character: 15 }}}
])

// 生成飞书卡片
const card = diagnosticTrackingService.generateDiagnosticCard(
  diagnosticTrackingService.getNewDiagnostics()
)
```

## 来源

借鉴 Claude Code services/diagnosticTracking.ts