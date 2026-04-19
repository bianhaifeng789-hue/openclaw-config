---
name: agent-summary-service
description: "Agent摘要服务。生成Agent工作摘要报告，总结活动统计。Use when generating agent activity summary."
---

# Agent Summary Service

## 功能

生成Agent工作摘要。

### 摘要内容

- 任务完成统计 - 完成数、成功率
- 工具使用分析 - 使用频率、效果
- 错误总结 - 错误类型、解决方案
- 效率指标 - 处理时间、节省tokens

### 使用示例

```javascript
// 生成摘要
const summary = generateAgentSummary(sessionId);

// 返回摘要
{
  tasksCompleted: 15,
  tasksFailed: 2,
  successRate: '93%',
  topTools: ['read', 'exec', 'write'],
  errorsEncountered: 3,
  errorTypes: ['timeout', 'permission'],
  tokensUsed: 50000,
  tokensSaved: 20000
}
```

### 摘要时机

- 会话结束时生成
- 定期总结任务
- 用户请求时生成

---

来源: Claude Code services/agentSummary.ts