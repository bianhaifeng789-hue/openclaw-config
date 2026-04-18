---
name: time-budget
description: TimeBudget时间预算管理，三阶段预警（60%警告→85%关闭新功能→100%强制停止）。防止Agent超时，确保在deadline前完成核心任务。适用所有有时间限制的任务。
---

# Time Budget - 时间预算管理

## 概述

监控Agent时间消耗，分阶段预警和限制。

来源：Harness Engineering - TimeBudgetMiddleware

## 三阶段策略

### Stage 1: Warning（60%预算）

**触发条件**：elapsed ≥ 60% of budget

**处理**：
```javascript
injectNudge({
  type: 'budget_warning',
  message: '60% of time budget used. Consider focusing on core requirements.',
  budgetUsed: `${elapsed}s / ${budget}s`,
  remaining: `${budget - elapsed}s`
});
```

---

### Stage 2: Critical（85%预算）

**触发条件**：elapsed ≥ 85% of budget

**处理**：
```javascript
// 关闭新功能
disableNewFeatures();

injectNudge({
  type: 'budget_critical',
  message: '85% of time budget used. Stop adding new features, focus on verifying existing work.',
  budgetUsed: `${elapsed}s / ${budget}s`,
  remaining: `${budget - elapsed}s`,
  restrictions: [
    'No new file creation',
    'No new dependencies',
    'Focus on verification'
  ]
});
```

---

### Stage 3: Stop（100%预算）

**触发条件**：elapsed ≥ 100% of budget

**处理**：
```javascript
// 强制停止
injectNudge({
  type: 'budget_stop',
  message: 'Time budget exhausted. Wrap up immediately.',
  budgetUsed: `${elapsed}s / ${budget}s`,
  overBudget: `${elapsed - budget}s`,
  action: 'finish'
});
```

---

## 与OpenClaw集成

### Agent循环检查

```javascript
// Agent while循环中
const elapsed = Date.now() - startTime;

const budgetResult = timeBudget.check(elapsed, budget);

if (budgetResult.stage === 'warning') {
  // 注入警告
  injectNudge(budgetResult.nudge);
}

if (budgetResult.stage === 'critical') {
  // 关闭新功能
  restrictTools(['write', 'exec-install']);
  injectNudge(budgetResult.nudge);
}

if (budgetResult.stage === 'stop') {
  // 强制退出
  finishReason = 'budget_exhausted';
  break;
}
```

---

## TB2动态时间分配

### 基于Timeout的策略

| Timeout | 策略 | Planner | Builder | Evaluator |
|---------|------|---------|---------|-----------|
| ≤900s | 跳过全部 | 0% | 100% | 0% |
| ≤1800s | 跳过Planner | 0% | 100% | 0% |
| >1800s | 保留Evaluator | 0% | 90% | 10% |

### 元数据查询

```javascript
// 从tb2_tasks.json查询timeout
const taskMeta = tb2Tasks.find(t => 
  t.workspace === currentWorkspace || 
  t.prompt.includes(currentPrompt)
);

const budget = taskMeta?.agent_timeout_sec || 1800;
```

---

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| warnThreshold | 0.60 | 警告阈值（60%） |
| criticalThreshold | 0.85 | 严重阈值（85%） |
| stopThreshold | 1.00 | 停止阈值（100%） |
| defaultBudget | 1800 | 默认预算（1800秒） |
| nudgeInterval | 300 | 提醒间隔（300秒） |

---

创建时间：2026-04-17 12:34
版本：1.0.0
状态：已集成到OpenClaw Agent循环