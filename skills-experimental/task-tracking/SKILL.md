---
name: task-tracking
description: TaskTracking任务追踪，第4次工具调用强制创建_todo.md，每12次检查更新。防止Agent遗忘任务目标和进度。适用所有长任务场景。
---

# Task Tracking - 任务追踪

## 概述

强制Agent记录任务进度，防止遗忘目标。

来源：Harness Engineering - TaskTrackingMiddleware

## 强制创建机制

### 触发条件：第4次工具调用

**算法**：
```javascript
let toolCallCount = 0;

for (const call of toolCalls) {
  toolCallCount++;
  
  if (toolCallCount === 4) {
    // 检查_todo.md是否存在
    if (!fs.existsSync('_todo.md')) {
      injectNudge({
        type: 'create_todo',
        message: 'Create _todo.md to track progress. Format: ## Done, ## Current, ## Next, ## Blockers.',
        mandatory: true
      });
      
      // 记录强制创建
      taskStats.todoCreated++;
    }
  }
}
```

---

## 定期检查机制

### 触发条件：每12次工具调用

**算法**：
```javascript
if (toolCallCount % 12 === 0) {
  if (fs.existsSync('_todo.md')) {
    const currentTodo = fs.readFileSync('_todo.md', 'utf8');
    const currentHash = hashContent(currentTodo);
    
    // Hash变化检测
    if (currentHash !== taskStats.lastTodoHash) {
      taskStats.lastTodoHash = currentHash;
      taskStats.todoUpdates++;
      
      // 确认更新
      console.log('_todo.md updated (hash changed)');
    }
  } else {
    // 再次强制创建
    injectNudge({
      type: 'recreate_todo',
      message: '_todo.md still missing. Create it now.',
      mandatory: true
    });
  }
}
```

---

## _todo.md格式

```markdown
# Task Progress

## Done
- [x] Analyzed requirements
- [x] Created project structure
- [x] Implemented core logic

## Current
- [ ] Testing integration

## Next
- [ ] Fix bugs from testing
- [ ] Add documentation

## Blockers
- Database connection issue (need credentials)

## Decisions
- Using SQLite instead of PostgreSQL (simpler setup)
```

---

## 与OpenClaw集成

### Agent循环追踪

```javascript
// Agent while循环中
for (const message of response.messages) {
  if (message.role === 'assistant') {
    // 任务追踪检查
    const taskResult = taskTracking.check(toolCallCount);
    
    if (taskResult.action === 'create_todo') {
      injectNudge(taskResult.nudge);
    }
    
    if (taskResult.action === 'update_todo') {
      injectNudge(taskResult.nudge);
    }
  }
}
```

---

## 状态追踪

### heartbeat-state.json字段

```json
{
  "taskStats": {
    "todoCreated": 0,
    "todoUpdates": 0,
    "lastTodoHash": null,
    "toolCallCount": 0,
    "lastUpdateCheck": null
  }
}
```

---

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| createThreshold | 4 | 强制创建阈值 |
| updateThreshold | 12 | 更新检查阈值 |
| hashCheckEnabled | true | Hash变化检测 |
| mandatoryNudge | true | 是否强制 |

---

## 效果预期

| 问题 | Before | After |
|------|--------|-------|
| **遗忘目标** | Agent做了一半忘记初衷 | _todo.md持续提醒 |
| **进度丢失** | 失败后重新开始 | _todo.md提供checkpoint |
| **无结构** | 混乱的输出 | 结构化的进度记录 |

---

创建时间：2026-04-17 12:34
版本：1.0.0
状态：已集成到OpenClaw Agent循环