# Command Lifecycle Skill

**优先级**: P29
**来源**: Claude Code `commandLifecycle.ts`
**适用场景**: 命令状态追踪

---

## 概述

Command Lifecycle提供命令生命周期状态追踪，支持 `started` | `completed` 状态通知。监听器回调用于追踪命令执行状态。

---

## 核心功能

### 1. 状态定义

```typescript
type CommandLifecycleState = 'started' | 'completed' | 'failed'

type CommandLifecycleListener = (
  uuid: string,
  state: CommandLifecycleState
) => void
```

### 2. 监听器管理

```typescript
let listener: CommandLifecycleListener | null = null

export function setCommandLifecycleListener(
  cb: CommandLifecycleListener | null
): void {
  listener = cb
}
```

### 3. 状态通知

```typescript
export function notifyCommandLifecycle(
  uuid: string,
  state: CommandLifecycleState
): void {
  listener?.(uuid, state)
}
```

---

## OpenClaw应用

### 1. 飞书任务追踪

```typescript
// 设置监听器
setCommandLifecycleListener((uuid, state) => {
  if (state === 'started') {
    // 发送飞书进度卡片
    sendFeishuProgressCard(uuid, 'in_progress')
  } else if (state === 'completed') {
    // 发送飞书完成卡片
    sendFeishuProgressCard(uuid, 'completed')
  } else if (state === 'failed') {
    // 发送飞书失败通知
    sendFeishuErrorCard(uuid)
  }
})

// 命令执行时通知
notifyCommandLifecycle(taskId, 'started')
try {
  await executeTask()
  notifyCommandLifecycle(taskId, 'completed')
} catch (error) {
  notifyCommandLifecycle(taskId, 'failed')
}
```

---

## 状态文件

```json
{
  "skill": "command-lifecycle",
  "priority": "P29",
  "source": "commandLifecycle.ts",
  "enabled": true,
  "states": ["started", "completed", "failed"],
  "listenerSet": false,
  "notifications": 0,
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `commandLifecycle.ts`