---
name: task-stop-tool-directory
description: "任务停止工具目录。管理任务停止相关工具，提供任务取消和终止功能。Use when stopping or canceling running tasks."
---

# Task Stop Tool Directory

## 功能

管理任务停止工具。

### 核心工具

- stop_task - 正常停止任务
- cancel_all - 取消所有正在执行的任务
- force_kill - 强制终止卡死的任务

### 使用示例

```javascript
// 正常停止
stopTask('task-001', { reason: 'user-cancel' });

// 强制终止卡死的任务
forceKill('task-002', { timeout: 5000 });

// 取消所有任务
cancelAllTasks();
```

### 停止策略

- graceful - 优雅停止（等待完成）
- immediate - 立即停止
- force - 强制终止

### 停止时机

- 用户主动取消
- 任务超时
- 系统异常

---

来源: Claude Code tasks/stopTool.ts