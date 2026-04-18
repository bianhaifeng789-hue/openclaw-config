---
name: analyze-context-pattern
description: "上下文分析模式。分析消息历史，提取关键信息，识别用户意图。Use when analyzing conversation context."
---

# Analyze Context Pattern

## 功能

分析对话上下文，提取关键信息。

### 分析维度

- 用户意图识别
- 关键实体提取
- 情感分析
- 任务状态追踪

### 示例

```javascript
// 分析最近10条消息
const analysis = analyzeContext(messages.slice(-10));

// 返回
{
  intent: 'query_roi',
  entities: ['广告', '成本', '收入'],
  sentiment: 'positive',
  pendingTasks: ['计算ROI', '生成报告']
}
```

---

来源: Claude Code context/analyzeContext.ts