---
name: cron-scheduler-core
description: "Cron scheduler core. CronSchedulerOptions + CronScheduler (start/stop/getNextFireTime) + createCronScheduler + isRecurringTaskAged + CHECK_INTERVAL_MS=1000 + FILE_STABILITY_MS=300 + LOCK_PROBE_INTERVAL_MS=5000 + Assistant mode bypass + Missed task handling + Lock identity + PID. Use when [cron scheduler core] is needed."
metadata:
  openclaw:
    emoji: "⏰"
    triggers: [cron, scheduler]
    feishuCard: true
---

# Cron Scheduler Core Skill - Cron Scheduler Core

Cron Scheduler Core 定时任务调度核心。

## 为什么需要这个？

**场景**：
- Task scheduling
- Missed task handling
- Lock system
- Jitter support
- Assistant mode

**Claude Code 方案**：cronScheduler.ts + 536+ lines
**OpenClaw 飞书适配**：Cron scheduler + Task scheduling

---

## Constants

```typescript
const CHECK_INTERVAL_MS = 1000
const FILE_STABILITY_MS = 300
const LOCK_PROBE_INTERVAL_MS = 5000
```

---

## Types

### CronSchedulerOptions

```typescript
type CronSchedulerOptions = {
  onFire: (prompt: string) => void
  isLoading: () => boolean
  assistantMode?: boolean
  onFireTask?: (task: CronTask) => void
  onMissed?: (tasks: CronTask[]) => void
  dir?: string
  lockIdentity?: string
  getJitterConfig?: () => CronJitterConfig
  isKilled?: () => boolean
  filter?: (t: CronTask) => boolean
}
```

### CronScheduler

```typescript
type CronScheduler = {
  start: () => void
  stop: () => void
  getNextFireTime: () => number | null
}
```

---

## Functions

### 1. Create Cron Scheduler

```typescript
export function createCronScheduler(
  options: CronSchedulerOptions,
): CronScheduler {
  const {
    onFire,
    isLoading,
    assistantMode = false,
    onFireTask,
    onMissed,
    dir,
    lockIdentity,
    getJitterConfig,
    isKilled,
    filter,
  } = options

  // Implementation...

  return {
    start: () => { /* Start scheduler */ },
    stop: () => { /* Stop scheduler */ },
    getNextFireTime: () => { /* Get next fire time */ },
  }
}
```

### 2. Check Aged Task

```typescript
export function isRecurringTaskAged(
  t: CronTask,
  nowMs: number,
  maxAgeMs: number,
): boolean {
  if (maxAgeMs === 0) return false
  return Boolean(t.recurring && !t.permanent && nowMs - t.createdAt >= maxAgeMs)
}
```

---

## 飞书卡片格式

### Cron Scheduler Core 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏰ Cron Scheduler Core**\n\n---\n\n**Constants**：\n• CHECK_INTERVAL_MS = 1000\n• FILE_STABILITY_MS = 300\n• LOCK_PROBE_INTERVAL_MS = 5000\n\n---\n\n**Types**：\n• CronSchedulerOptions\n• CronScheduler (start/stop/getNextFireTime)\n\n---\n\n**Functions**：\n• createCronScheduler()\n• isRecurringTaskAged()\n\n---\n\n**Features**：\n• Missed task handling\n• Lock system\n• Jitter support\n• Assistant mode bypass"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/cron-scheduler-core-state.json
{
  "stats": {
    "totalScheduled": 0,
    "missedTasks": 0
  },
  "lastUpdate": "2026-04-12T11:26:00Z",
  "notes": "Cron Scheduler Core Skill 创建完成。"
}