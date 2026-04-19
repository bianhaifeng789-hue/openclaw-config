---
name: use-task-list-watcher-hook
description: "任务列表监听Hook。监听任务列表变化，自动更新显示状态。Use when watching task list for changes."
---

# Use Task List Watcher Hook

## 功能

监听任务列表变化。

### 监听事件

- taskCreated - 新任务创建
- taskUpdated - 任务状态更新
- taskCompleted - 任务完成
- taskFailed - 任务失败
- taskCancelled - 任务取消

### 使用示例

```javascript
// 设置监听
watchTaskList((event) => {
  switch (event.type) {
    case 'taskCreated':
      addTaskToList(event.task);
      break;
    case 'taskCompleted':
      markTaskComplete(event.taskId);
      break;
  }
});

// 停止监听
unwatchTaskList();
```

### 应用场景

- 实时任务显示更新
- 任务进度监控
- 任务状态通知

---

来源: Claude Code hooks/useTaskListWatcher.ts