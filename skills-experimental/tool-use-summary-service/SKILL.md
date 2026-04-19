---
name: tool-use-summary-service
description: "工具使用摘要服务。统计工具调用次数、成功率、失败原因，生成摘要报告。Use when generating periodic tool usage reports."
---

# Tool Use Summary Service

## 实际功能

统计工具使用情况，生成摘要。

### 核心逻辑

```javascript
// 统计工具使用
const toolStats = {
  totalCalls: 0,
  successRate: 0,
  topTools: [],
  failures: []
};

function generateToolSummary(period) {
  const calls = getToolCalls(period);

  return {
    totalCalls: calls.length,
    successRate: calls.filter(c => c.success).length / calls.length * 100,
    topTools: getTopTools(calls, 5),
    failures: calls.filter(c => !c.success).slice(0, 3)
  };
}
```

### 飞书卡片格式

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📊 工具使用摘要**\n\n总调用: 234次\n成功率: 95.3%\n\nTop 工具:\n• read: 120次\n• exec: 80次\n• write: 30次"
      }
    }
  ]
}
```

### 心跳集成

- interval: 1h
- priority: medium
- 触发: notable progress

---

来源: Claude Code services/toolUseSummary/