---
name: tool-use-summary
description: "Generate human-readable summaries of tool usage Use when [tool use summary] is needed."
triggers:
  - tool_summary
  - usage_summary
  - progress_summary
metadata:
  openclaw:
    source: claude-code-pattern
    category: reporting
    priority: high
---

# Tool Use Summary Service

借鉴 Claude Code toolUseSummary.ts，生成工具使用摘要。

## 核心功能

| 功能 | 说明 |
|------|------|
| generateSummary | 生成摘要 |
| getToolStats | 获取工具统计 |
| generateSummaryCard | 飞书摘要卡片 |

## 摘要模板

- read: "读取了 N 个文件"
- write: "创建了 N 个文件"
- edit: "编辑了 N 个文件"
- bash: "执行了 N 个命令"
- feishu: "处理了 N 个飞书操作"

## 使用示例

```typescript
import { toolUseSummaryService } from './tool-use-summary-service.js'

// 生成摘要
const summary = toolUseSummaryService.generateSummary({
  tools: [{ name: 'read', input: {}, output: {}, success: true }],
  context: '分析阶段'
})

// 生成飞书卡片
const card = toolUseSummaryService.generateSummaryCard()
```