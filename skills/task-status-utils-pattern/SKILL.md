---
name: task-status-utils-pattern
description: "任务状态工具模式。管理任务状态（pending/running/completed/failed）。Use when tracking task execution status."
---

# Task Status Utils Pattern

## 功能

管理任务状态。

### 状态类型

- pending - 待执行
- running - 执行中
- completed - 已完成
- failed - 失败

### 示例

```javascript
const task = {
  id: 'task-001',
  status: 'running',
  progress: 60,
  startedAt: Date.now()
};

updateTaskStatus(task.id, 'completed');
```

---

来源: Claude Code utils/taskStatus.ts