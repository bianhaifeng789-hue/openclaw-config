---
name: task-core-reference
description: "任务核心参考文档。任务管理核心API，定义任务类型和状态。Use when working with task management system."
---

# Task Core Reference

## 功能

任务管理核心。

### 任务类型

- local_shell
- local_agent
- remote_agent
- dream

### 示例

```javascript
createTask({
  type: 'local_shell',
  command: 'npm test',
  timeout: 60000
});
```

---

来源: Claude Code tasks/core.ts