---
name: tip-scheduler-service
description: "提示调度服务。定时显示使用提示给用户，智能推送相关建议。Use when scheduling tip displays."
---

# Tip Scheduler Service

## 功能

调度提示显示时机。

### 配置参数

- interval - 显示间隔（默认1小时）
- tipPool - 提示池来源（默认auto）
- priority - 显示优先级（high/medium/low）
- maxTipsPerDay - 每日最大提示数

### 使用示例

```javascript
// 调度提示
scheduleTip({
  interval: '1h',
  tip: '使用compact定期清理上下文',
  priority: 'medium',
  category: 'best-practice'
});

// 获取待显示提示
const nextTip = getNextScheduledTip();
```

### 提示类型

- best-practice - 最佳实践提示
- feature - 新功能介绍
- warning - 警告提示
- shortcut - 快捷方式

---

来源: Claude Code services/tipScheduler.ts