---
name: signal-primitive
description: |
  Lightweight event signal primitive. Subscribe/emit/clear pattern for pure event notifications without stored state.
  
  Use when:
  - Need pub/sub event notification between components
  - Multiple subscribers need to react to the same event
  - Avoiding polling in favor of push notifications
  
  Keywords: signal, event, pub/sub, subscribe, emit, listener, notification
metadata:
  openclaw:
    emoji: "📡"
    source: claude-code-signal
    triggers: [event-notification, pub-sub, reactive]
    priority: P2
---

# Signal Primitive

基于 Claude Code `utils/signal.ts` 的轻量级事件信号原语。

## 核心实现（直接来自 Claude Code）

```typescript
type Signal<Args extends unknown[] = []> = {
  subscribe: (listener: (...args: Args) => void) => () => void  // 返回取消订阅函数
  emit: (...args: Args) => void
  clear: () => void
}

function createSignal<Args extends unknown[] = []>(): Signal<Args> {
  const listeners = new Set<(...args: Args) => void>()
  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)  // 返回 unsubscribe
    },
    emit(...args) {
      for (const listener of listeners) listener(...args)
    },
    clear() {
      listeners.clear()
    },
  }
}
```

## 与 Store 的区别

| Signal | Store (AppState) |
|--------|-----------------|
| 无状态（只通知） | 有状态（存储当前值） |
| 订阅者只知道"发生了" | 订阅者可以读取当前值 |
| 适合事件通知 | 适合状态同步 |

## OpenClaw 使用场景

### 任务更新通知
```javascript
// tasks.ts
const tasksUpdated = createSignal()
export const onTasksUpdated = tasksUpdated.subscribe

// 当任务列表变化时
async function createTask(task) {
  await writeTaskFile(task)
  tasksUpdated.emit()  // 通知所有订阅者
}

// 订阅者
const unsubscribe = onTasksUpdated(() => {
  refreshTaskDisplay()
})
// 清理时
unsubscribe()
```

### 设置变更通知
```javascript
const settingsChanged = createSignal<[SettingSource]>()

// 设置更新时
function updateSetting(key, value, source) {
  writeSetting(key, value)
  settingsChanged.emit(source)
}

// 订阅
settingsChanged.subscribe((source) => {
  console.log(`设置已从 ${source} 更新`)
})
```

### Cron 任务触发通知
```javascript
const cronFired = createSignal<[CronTask]>()

// cron 触发时
function fireCronTask(task) {
  executePrompt(task.prompt)
  cronFired.emit(task)
}

// 记录日志
cronFired.subscribe((task) => {
  logToMemory(`Cron 任务触发: ${task.prompt}`)
})
```

## 在 OpenClaw 中的应用

Claude Code 中 `createSignal` 被用于约 15 处，主要场景：
- `tasksUpdated` — 任务列表变化
- `settingsChanged` — 设置变更
- `skillsChanged` — skills 目录变化
- `memoryFilesChanged` — 记忆文件变化
- `cronTasksFired` — cron 任务触发

OpenClaw 可以用同样的模式替代轮询检查。
