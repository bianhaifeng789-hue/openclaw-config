---
name: feishu-card-builder
description: "Feishu interactive card builder for OpenClaw Use when [feishu card builder] is needed."
triggers:
  - feishu_card
  - card
  - feishu
metadata:
  openclaw:
    source: openclaw-extension
    category: ui
    priority: high
---

# Feishu Card Builder

飞书交互卡片构建服务，用于 OpenClaw 各模块的可视化。

## 核心功能

| 功能 | 说明 |
|------|------|
| buildProgressCard | 进度卡片 |
| buildDialogCard | 对话卡片 |
| buildListCard | 列表卡片 |
| buildStatusCard | 状态卡片 |
| buildDiagnosticCard | 诊断卡片 |
| buildApprovalCard | 审批卡片 |

## 卡片类型

1. **进度卡片** - 任务进度可视化
2. **对话卡片** - 交互式确认
3. **列表卡片** - 多项目展示
4. **状态卡片** - 系统状态监控
5. **诊断卡片** - 错误/警告展示
6. **审批卡片** - MCP 服务器审批

## 使用示例

```typescript
import { feishuCards } from './feishu-cards.js'

// 进度卡片
const card = feishuCards.buildProgressCard({
  title: '正在分析...',
  progress: 50,
  items: ['已完成步骤1', '正在步骤2']
})

// 诊断卡片
const diagCard = feishuCards.buildDiagnosticCard({
  errors: 3,
  warnings: 5,
  files: ['file1.ts', 'file2.ts']
})
```

## 飞书卡片格式

遵循飞书卡片消息规范：
- header (标题)
- elements (内容元素)
- config (配置)