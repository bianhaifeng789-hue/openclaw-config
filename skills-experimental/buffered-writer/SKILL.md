---
name: buffered-writer
description: "Buffered writer for batch writes. createBufferedWriter + write/flush/dispose. flushIntervalMs=1000 default. maxBufferSize/maxBufferBytes limits. Deferred flush with setImmediate. Use when [buffered writer] is needed."
metadata:
  openclaw:
    emoji: "📝"
    triggers: [buffered-write, buffered-flush]
    feishuCard: true
---

# Buffered Writer Skill - Buffered Writer

Buffered Writer 批量写入优化。

## 为什么需要这个？

**场景**：
- Batch writes for performance
- Deferred flush
- Write throttling
- Buffer limits
- Immediate mode option

**Claude Code 方案**：bufferedWriter.ts + 108 lines
**OpenClaw 飞书适配**：Buffered writer + Batch writes

---

## BufferedWriter Type

```typescript
type BufferedWriter = {
  write: (content: string) => void
  flush: () => void
  dispose: () => void
}

function createBufferedWriter({
  writeFn,
  flushIntervalMs = 1000,
  maxBufferSize = 100,
  maxBufferBytes = Infinity,
  immediateMode = false,
}): BufferedWriter
```

---

## Constants

```typescript
flushIntervalMs = 1000  // Default flush interval
maxBufferSize = 100     // Max buffer items
maxBufferBytes = Infinity  // Max buffer bytes
immediateMode = false   // Immediate write mode
```

---

## Usage Example

```typescript
// Create buffered writer
const writer = createBufferedWriter({
  writeFn: (content) => fs.appendFileSync('log.txt', content),
  flushIntervalMs: 1000,
  maxBufferSize: 100,
})

// Write content (buffered)
writer.write('line1\n')
writer.write('line2\n')
writer.write('line3\n')

// Flush manually
writer.flush()

// Dispose (flush + cleanup)
writer.dispose()
```

---

## 飞书卡片格式

### Buffered Writer 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📝 Buffered Writer**\n\n---\n\n**Type**：\n```typescript\ntype BufferedWriter = {\n  write: (content: string) => void\n  flush: () => void\n  dispose: () => void\n}\n```\n\n---\n\n**Constants**：\n• flushIntervalMs = 1000\n• maxBufferSize = 100\n• maxBufferBytes = Infinity\n• immediateMode = false\n\n---\n\n**Features**：\n• Batch writes\n• Deferred flush\n• Write throttling\n• Buffer limits"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/buffered-writer-state.json
{
  "writers": [],
  "stats": {
    "totalWriters": 0,
    "totalWrites": 0,
    "totalFlushes": 0
  },
  "lastUpdate": "2026-04-12T01:54:00Z",
  "notes": "Buffered Writer Skill 创建完成。等待 write 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| bufferedWriter.ts (108 lines) | Skill + Writer |
| createBufferedWriter() | Create writer |
| write/flush/dispose | Methods |
| flushIntervalMs = 1000 | Default interval |

---

## 注意事项

1. **flushIntervalMs**：Timer-based flush（1000ms）
2. **Buffer limits**：Size and bytes limits
3. **Deferred flush**：setImmediate on overflow
4. **immediateMode**：Bypass buffering
5. **dispose**：Flush + cleanup

---

## 自动启用

此 Skill 在 write operation 时自动运行。

---

## 下一步增强

- 飞书 writer 集成
- Writer analytics
- Writer debugging