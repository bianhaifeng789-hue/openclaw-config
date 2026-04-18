# Prevent Sleep Skill

**优先级**: P32
**来源**: Claude Code `preventSleep.ts`
**适用场景**: macOS防止睡眠

---

## 概述

Prevent Sleep使用macOS `caffeinate`防止睡眠，RefCount管理，自动重启（5分钟timeout，4分钟restart）。

---

## 核心功能

### 1. RefCount管理

```typescript
const CAFFEINATE_TIMEOUT_SECONDS = 300 // 5 minutes
const RESTART_INTERVAL_MS = 4 * 60 * 1000

let refCount = 0

export function startPreventSleep(): void {
  refCount++
  if (refCount === 1) {
    spawnCaffeinate()
    startRestartInterval()
  }
}

export function stopPreventSleep(): void {
  if (refCount > 0) refCount--
  if (refCount === 0) {
    stopRestartInterval()
    killCaffeinate()
  }
}
```

### 2. Caffeinate Spawn

```typescript
function spawnCaffeinate(): void {
  if (process.platform !== 'darwin') return
  
  caffeinateProcess = spawn('caffeinate', [
    '-i', // Prevent idle sleep
    '-t', String(CAFFEINATE_TIMEOUT_SECONDS) // Timeout
  ], { stdio: 'ignore' })
  
  caffeinateProcess.unref()
  registerCleanup(() => forceStopPreventSleep())
}
```

### 3. Self-healing

```typescript
// Auto-restart before expiry
restartInterval = setInterval(() => {
  if (refCount > 0) {
    killCaffeinate()
    spawnCaffeinate()
  }
}, RESTART_INTERVAL_MS)
restartInterval.unref()
```

---

## OpenClaw应用

### 1. 长时间任务防睡眠

```typescript
// 开始长时间任务
startPreventSleep()

// 任务完成后释放
stopPreventSleep()
```

---

## 状态文件

```json
{
  "skill": "prevent-sleep",
  "priority": "P32",
  "source": "preventSleep.ts",
  "enabled": true,
  "platform": "darwin",
  "timeoutSeconds": 300,
  "restartIntervalMs": 240000,
  "createdAt": "2026-04-12T14:00:00Z"
}
```

---

## 参考

- Claude Code: `preventSleep.ts`