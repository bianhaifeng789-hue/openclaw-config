---
name: use-scheduled-tasks-hook
description: "定时任务Hook。管理定时执行的任务，自动触发周期性检查。Use when managing scheduled periodic tasks."
---

# Use Scheduled Tasks Hook

## 功能

管理定时任务。

### 任务类型

- cron - 定时执行（如每天9点）
- interval - 周期执行（如每5分钟）
- once - 单次延迟（如10分钟后）

### 配置示例

```javascript
scheduleTask({
  name: 'health-monitor',
  interval: '5m',
  action: () => checkHealth(),
  priority: 'high'
});
```

### 使用场景

- 健康监控定时检查
- 数据定期同步
- 日志定时清理
- 报告定期生成

---

来源: Claude Code hooks/useScheduledTasks.ts