---
name: sleep-utils
description: "Abort-responsive sleep utilities. sleep() with AbortSignal + withTimeout() race promise against timeout + throwOnAbort/abortError/unref options + Don't block process exit. Use when [sleep utils] is needed."
metadata:
  openclaw:
    emoji: "⏱️"
    triggers: [sleep-wait, timeout-race]
    feishuCard: true
---

# Sleep Utils Skill - Sleep Utils

Sleep Utils 可中断睡眠工具。

## 为什么需要这个？

**场景**：
- Abort-responsive sleep
- Timeout race
- Don't block exit
- Backoff loops
- Retry delays

**Claude Code 方案**：sleep.ts + 90+ lines
**OpenClaw 飞书适配**：Sleep utils + Abort support

---

## Functions

### 1. Sleep (Abort-responsive)

```typescript
function sleep(
  ms: number,
  signal?: AbortSignal,
  opts?: { throwOnAbort?: boolean; abortError?: () => Error; unref?: boolean },
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check aborted state BEFORE setting up the timer
    if (signal?.aborted) {
      if (opts?.throwOnAbort || opts?.abortError) {
        void reject(opts.abortError?.() ?? new Error('aborted'))
      } else {
        void resolve()
      }
      return
    }

    const timer = setTimeout(...)

    // Abort listener
    signal?.addEventListener('abort', onAbort, { once: true })

    // Don't block process exit
    if (opts?.unref) {
      timer.unref()
    }
  })
}
```

### 2. With Timeout

```typescript
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  // Race promise against timeout
  // Timeout timer is unref'd (don't block exit)
  // Rejects with Error(message) if timeout
}
```

---

## Options

| Option | Description |
|--------|-------------|
| throwOnAbort | Reject on abort（default: resolve silently） |
| abortError | Custom abort error |
| unref | Don't block process exit |

---

## 飞书卡片格式

### Sleep Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏱️ Sleep Utils**\n\n---\n\n**Functions**：\n• sleep(ms, signal?, opts?) - Abort-responsive\n• withTimeout(promise, ms, message) - Timeout race\n\n---\n\n**Options**：\n• throwOnAbort - Reject on abort\n• abortError - Custom error\n• unref - Don't block exit\n\n---\n\n**AbortSignal**：\n• Resolves immediately on abort"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/sleep-utils-state.json
{
  "stats": {
    "totalSleeps": 0,
    "abortedSleeps": 0,
    "timeoutRaces": 0
  },
  "lastUpdate": "2026-04-12T10:32:00Z",
  "notes": "Sleep Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| sleep.ts (90+ lines) | Skill + Sleep |
| sleep() | Abort-responsive |
| withTimeout() | Timeout race |
| unref option | Don't block exit |

---

## 注意事项

1. **Abort-responsive** - Resolves on abort
2. **throwOnAbort** - Reject instead of resolve
3. **unref** - Don't block process exit
4. **withTimeout** - Race against timeout
5. **Timer cleanup** - Clear on settlement

---

## 自动启用

此 Skill 在 sleep operation 时自动运行。

---

## 下一步增强

- 飞书 sleep 集成
- Sleep analytics
- Sleep debugging