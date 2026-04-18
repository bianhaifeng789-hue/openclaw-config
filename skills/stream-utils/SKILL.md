---
name: stream-utils
description: "Stream utils for async iterator. Stream<T> + enqueue/done/error/next + AsyncIterator implementation + Queue-based + Single iteration only. Use when [stream utils] is needed."
metadata:
  openclaw:
    emoji: "🌊"
    triggers: [stream-enqueue, stream-read]
    feishuCard: true
---

# Stream Utils Skill - Stream Utils

Stream Utils 异步迭代流。

## 为什么需要这个？

**场景**：
- Async iterator stream
- Queue-based buffering
- Enqueue values
- Done/error markers
- Single iteration

**Claude Code 方案**：stream.ts + 61 lines
**OpenClaw 飞书适配**：Stream utils + Async iterator

---

## Stream Class

```typescript
class Stream<T> implements AsyncIterator<T> {
  private readonly queue: T[] = []
  private readResolve?: (value: IteratorResult<T>) => void
  private readReject?: (error: unknown) => void
  private isDone: boolean = false
  private hasError: unknown | undefined
  private started = false

  constructor(private readonly returned?: () => void) {}

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    if (this.started) {
      throw new Error('Stream can only be iterated once')
    }
    this.started = true
    return this
  }

  enqueue(value: T): void {
    if (this.readResolve) {
      const resolve = this.readResolve
      this.readResolve = undefined
      this.readReject = undefined
      resolve({ done: false, value })
    } else {
      this.queue.push(value)
    }
  }

  done() {
    this.isDone = true
    if (this.readResolve) {
      const resolve = this.readResolve
      this.readResolve = undefined
      this.readReject = undefined
      resolve({ done: true, value: undefined })
    }
  }

  error(error: unknown) {
    this.hasError = error
    if (this.readReject) {
      const reject = this.readReject
      this.readResolve = undefined
      this.readReject = undefined
      reject(error)
    }
  }

  next(): Promise<IteratorResult<T, unknown>> {
    if (this.queue.length > 0) {
      return Promise.resolve({
        done: false,
        value: this.queue.shift()!,
      })
    }
    if (this.isDone) {
      return Promise.resolve({ done: true, value: undefined })
    }
    if (this.hasError) {
      return Promise.reject(this.hasError)
    }
    return new Promise<IteratorResult<T>>((resolve, reject) => {
      this.readResolve = resolve
      this.readReject = reject
    })
  }
}
```

---

## Usage Example

```typescript
const stream = new Stream<string>()

// Enqueue values
stream.enqueue('value1')
stream.enqueue('value2')

// Iterate
for await (const value of stream) {
  console.log(value)
}

// Mark done
stream.done()

// Mark error
stream.error(new Error('failed'))
```

---

## 飞书卡片格式

### Stream Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🌊 Stream Utils**\n\n---\n\n**Stream<T>**：\n```typescript\nclass Stream<T> implements AsyncIterator<T> {\n  enqueue(value: T): void\n  done(): void\n  error(error: unknown): void\n  next(): Promise<IteratorResult<T>>\n}\n```\n\n---\n\n**Features**：\n• Queue-based buffering\n• AsyncIterator\n• Single iteration only\n• Done/error markers"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/stream-utils-state.json
{
  "streams": [],
  "stats": {
    "totalEnqueues": 0,
    "totalReads": 0,
    "totalErrors": 0
  },
  "lastUpdate": "2026-04-12T02:00:00Z",
  "notes": "Stream Utils Skill 创建完成。等待 stream 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| stream.ts (61 lines) | Skill + Stream |
| Stream<T> | Stream class |
| enqueue/done/error/next | Methods |
| AsyncIterator | Iterator |

---

## 注意事项

1. **Single iteration**：Can only iterate once
2. **Queue-based**：Buffer before read
3. **Promise-based**：Async waiting
4. **Done marker**：Mark stream complete
5. **Error marker**：Mark stream error

---

## 自动启用

此 Skill 在 stream operation 时自动运行。

---

## 下一步增强

- 飞书 stream 集成
- Stream analytics
- Stream debugging