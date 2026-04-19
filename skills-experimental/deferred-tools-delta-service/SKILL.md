---
name: deferred-tools-delta-service
description: "延迟工具Delta服务。跟踪延迟工具调用的变化，管理待执行工具队列。Use when tracking deferred tool execution."
---

# Deferred Tools Delta Service

## 功能

跟踪延迟工具调用。

### 跟踪内容

- 待执行工具 - 等待执行的工具列表
- 已执行工具 - 完成执行的记录
- 失败工具 - 执行失败的记录
- 取消工具 - 用户取消的记录

### 使用示例

```javascript
// 获取delta
const delta = getDeferredDelta();

// 返回变化
{
  pending: ['tool-001', 'tool-002'],
  completed: ['tool-003'],
  failed: ['tool-004'],
  cancelled: []
}
```

### Delta用途

- 监控工具执行进度
- 检测执行瓶颈
- 分析失败原因
- 优化调度策略

---

来源: Claude Code services/deferredToolsDelta.ts