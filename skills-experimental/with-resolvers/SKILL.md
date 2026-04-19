---
name: with-resolvers
description: "Promise.withResolvers polyfill for Node 18+. withResolvers<T>() returns { promise, resolve, reject } - ES2024 feature for Node 22+ compatibility. Use when [with resolvers] is needed."
metadata:
  openclaw:
    emoji: "🔮"
    triggers: [promise-resolvers]
    feishuCard: true
---

# With Resolvers Skill - With Resolvers

With Resolvers Promise polyfill。

## 为什么需要这个？

**场景**：
- Promise.withResolvers polyfill
- Node 18+ support
- ES2024 feature
- { promise, resolve, reject }
- Deferred promise pattern

**Claude Code 方案**：withResolvers.ts + 20+ lines
**OpenClaw 飞书适配**：With resolvers + Promise polyfill

---

## Function

### With Resolvers

```typescript
function withResolvers<T>(): PromiseWithResolvers<T> {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}
```

---

## Usage Example

```typescript
const { promise, resolve, reject } = withResolvers<string>()

// Resolve later
setTimeout(() => resolve('done'), 1000)

// Await promise
const result = await promise  // 'done'
```

---

## 飞书卡片格式

### With Resolvers 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔮 With Resolvers**\n\n---\n\n**Function**：\n```typescript\nfunction withResolvers<T>():\n  PromiseWithResolvers<T>\n```\n\n---\n\n**Returns**：\n```typescript\n{ promise, resolve, reject }\n```\n\n---\n\n**Compatibility**：\n• Node 18+ support\n• ES2024 polyfill\n• Node 22+ native"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/with-resolvers-state.json
{
  "stats": {
    "totalCalls": 0
  },
  "lastUpdate": "2026-04-12T10:42:00Z",
  "notes": "With Resolvers Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| withResolvers.ts (20+ lines) | Skill + Promise |
| withResolvers<T>() | Polyfill |
| Node 18+ | Support |
| ES2024 | Feature |

---

## 注意事项

1. **Node 18+**：package.json engines
2. **ES2024**：Promise.withResolvers
3. **Polyfill**：Native in Node 22+
4. **Type-safe**：Generic type T
5. **Deferred**：Resolve/reject externally

---

## 自动启用

此 Skill 在 promise creation 时自动运行。

---

## 下一步增强

- 飞书 promise 集成
- Promise analytics
- Promise debugging