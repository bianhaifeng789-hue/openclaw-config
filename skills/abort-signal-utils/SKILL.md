---
name: abort-signal-utils
description: "Combined abort signal utilities. createCombinedAbortSignal + signalB + timeoutMs options + cleanup function (remove listeners + clear timer) + Bun memory optimization (setTimeout > AbortSignal.timeout). Use when combining abort signals, adding timeout controls, or managing cleanup."
metadata:
  openclaw:
    emoji: "🚫"
    triggers: [abort-signal, combined-abort]
    feishuCard: true
---

# Abort Signal Utils Skill - Abort Signal Utils

Abort Signal Utils 组合中止信号工具。

## 为什么需要这个？

**场景**：
- Combined abort signal（signal + signalB + timeout）
- Cleanup function（remove listeners + clear timer）
- Bun memory optimization
- Abort-responsive operations

**Claude Code 方案**：combinedAbortSignal.ts + 60+ lines
**OpenClaw 飞书适配**：Abort signal utils + Combined signal

---

## Function

### Create Combined Abort Signal

```typescript
function createCombinedAbortSignal(
  signal: AbortSignal | undefined,
  opts?: { signalB?: AbortSignal; timeoutMs?: number },
): { signal: AbortSignal; cleanup: () => void } {
  const { signalB, timeoutMs } = opts ?? {}
  const combined = createAbortController()

  if (signal?.aborted || signalB?.aborted) {
    combined.abort()
    return { signal: combined.signal, cleanup: () => {} }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const abortCombined = () => {
    if (timer !== undefined) clearTimeout(timer)
    combined.abort()
  }

  if (timeoutMs !== undefined) {
    timer = setTimeout(abortCombined, timeoutMs)
    timer.unref?.()
  }
  signal?.addEventListener('abort', abortCombined)
  signalB?.addEventListener('abort', abortCombined)

  const cleanup = () => {
    if (timer !== undefined) clearTimeout(timer)
    signal?.removeEventListener('abort', abortCombined)
    signalB?.removeEventListener('abort', abortCombined)
  }

  return { signal: combined.signal, cleanup }
}
```

---

## Bun Optimization

```typescript
// Under Bun, AbortSignal.timeout timers are finalized lazily
// and accumulate in native memory (~2.4KB/call)
// Use setTimeout + clearTimeout instead for immediate cleanup
```

---

## 飞书卡片格式

### Abort Signal Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🚫 Abort Signal Utils**\n\n---\n\n**Function**：\n```typescript\ncreateCombinedAbortSignal(\n  signal?: AbortSignal,\n  opts?: { signalB?: AbortSignal; timeoutMs?: number }\n): { signal: AbortSignal; cleanup: () => void }\n```\n\n---\n\n**Options**：\n• signal - Primary signal\n• signalB - Secondary signal\n• timeoutMs - Timeout\n\n---\n\n**Cleanup**：\n• clearTimeout(timer)\n• removeEventListener('abort')"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/abort-signal-utils-state.json
{
  "stats": {
    "totalCreated": 0
  },
  "lastUpdate": "2026-04-12T11:02:00Z",
  "notes": "Abort Signal Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| combinedAbortSignal.ts (60+ lines) | Skill + Abort |
| createCombinedAbortSignal() | Combined signal |
| cleanup() | Cleanup function |
| Bun optimization | Memory |

---

## 注意事项

1. **Bun optimization**：setTimeout > AbortSignal.timeout
2. **cleanup()**：Remove listeners + clear timer
3. **unref()**：Don't block exit
4. **Combined signal**：signal + signalB + timeout
5. **Early abort**：Check if already aborted

---

## 自动启用

此 Skill 在 abort signal 时自动运行。

---

## 下一步增强

- 飞书 abort 集成
- Abort analytics
- Abort debugging