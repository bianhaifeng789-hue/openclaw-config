---
name: cleanup-registry
description: "Cleanup registry for graceful shutdown. cleanupFunctions Set + registerCleanup + runCleanupFunctions + Unregister function return + Async cleanup support + Graceful shutdown integration. Use when [cleanup registry] is needed."
metadata:
  openclaw:
    emoji: "🧹"
    triggers: [cleanup, graceful-shutdown]
    feishuCard: true
---

# Cleanup Registry Skill - Cleanup Registry

Cleanup Registry 清理函数注册表。

## 为什么需要这个？

**场景**：
- Graceful shutdown
- Cleanup function management
- Async cleanup support
- Unregister capability
- Resource cleanup

**Claude Code 方案**：cleanupRegistry.ts + 30+ lines
**OpenClaw 飞书适配**：Cleanup registry + Graceful shutdown

---

## Functions

### 1. Register Cleanup

```typescript
const cleanupFunctions = new Set<() => Promise<void>>()

export function registerCleanup(cleanupFn: () => Promise<void>): () => void {
  cleanupFunctions.add(cleanupFn)
  return () => cleanupFunctions.delete(cleanupFn) // Return unregister function
}
```

### 2. Run Cleanup Functions

```typescript
export async function runCleanupFunctions(): Promise<void> {
  await Promise.all(Array.from(cleanupFunctions).map(fn => fn()))
}
```

---

## Usage Pattern

```typescript
// Register cleanup
const unregister = registerCleanup(async () => {
  await closeConnection()
  await flushBuffer()
})

// Later: unregister if needed
unregister()

// On shutdown: run all cleanups
await runCleanupFunctions()
```

---

## 飞书卡片格式

### Cleanup Registry 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🧹 Cleanup Registry**\n\n---\n\n**Features**：\n• cleanupFunctions Set\n• registerCleanup() returns unregister\n• runCleanupFunctions() async\n• Graceful shutdown support\n\n---\n\n**Pattern**：\n```typescript\nconst unregister = registerCleanup(async () => {...})\nunregister() // Optional\nawait runCleanupFunctions() // Shutdown\n```"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/cleanup-registry-state.json
{
  "stats": {
    "totalRegistered": 0,
    "activeCleanups": 0
  },
  "lastUpdate": "2026-04-12T11:26:00Z",
  "notes": "Cleanup Registry Skill 创建完成。"
}