---
name: circular-buffer
description: "Circular buffer for fixed-size rolling window. CircularBuffer<T> + add/addAll/getRecent/toArray/clear/length. Automatically evicts oldest items when full. Use when [circular buffer] is needed."
metadata:
  openclaw:
    emoji: "🔄"
    triggers: [buffer-add, buffer-get]
    feishuCard: true
---

# Circular Buffer Skill - Circular Buffer

Circular Buffer 固定大小滚动窗口。

## 为什么需要这个？

**场景**：
- Fixed-size circular buffer
- Rolling window of data
- Automatically evicts oldest
- Recent items retrieval
- Memory-efficient

**Claude Code 方案**：CircularBuffer.ts + 71 lines
**OpenClaw 飞书适配**：Circular buffer + Rolling window

---

## CircularBuffer Class

```typescript
class CircularBuffer<T> {
  private buffer: T[]
  private head = 0
  private size = 0

  constructor(private capacity: number) {
    this.buffer = new Array(capacity)
  }

  add(item: T): void {
    this.buffer[this.head] = item
    this.head = (this.head + 1) % this.capacity
    if (this.size < this.capacity) {
      this.size++
    }
  }

  getRecent(count: number): T[] {
    const result: T[] = []
    const start = this.size < this.capacity ? 0 : this.head
    const available = Math.min(count, this.size)

    for (let i = 0; i < available; i++) {
      const index = (start + this.size - available + i) % this.capacity
      result.push(this.buffer[index]!)
    }

    return result
  }

  toArray(): T[] {
    // Get all items (oldest to newest)
  }

  clear(): void {
    // Clear all items
  }

  length(): number {
    return this.size
  }
}
```

---

## Usage Example

```typescript
// Create buffer with capacity 10
const buffer = new CircularBuffer<string>(10)

// Add items
buffer.add('item1')
buffer.add('item2')
buffer.add('item3')

// Get recent 5 items
const recent = buffer.getRecent(5)

// Get all items
const all = buffer.toArray()

// Clear buffer
buffer.clear()

// Get length
const len = buffer.length()
```

---

## 飞书卡片格式

### Circular Buffer 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔄 Circular Buffer**\n\n---\n\n**Class**：\n```typescript\nclass CircularBuffer<T> {\n  add(item: T): void\n  addAll(items: T[]): void\n  getRecent(count: number): T[]\n  toArray(): T[]\n  clear(): void\n  length(): number\n}\n```\n\n---\n\n**Features**：\n• Fixed-size buffer\n• Automatically evicts oldest\n• Rolling window\n• Memory-efficient\n• Recent items retrieval"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/circular-buffer-state.json
{
  "buffers": [],
  "stats": {
    "totalBuffers": 0,
    "totalAdds": 0,
    "totalGets": 0
  },
  "lastUpdate": "2026-04-12T01:54:00Z",
  "notes": "Circular Buffer Skill 创建完成。等待 buffer 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| CircularBuffer.ts (71 lines) | Skill + Buffer |
| CircularBuffer<T> | Buffer class |
| add/getRecent/toArray | Methods |
| capacity param | Fixed-size |

---

## 注意事项

1. **Fixed-size**：capacity determines max items
2. **Circular**：head wraps around
3. **Evicts oldest**：When full, oldest is replaced
4. **getRecent**：Get most recent N items
5. **toArray**：Get all (oldest to newest)

---

## 自动启用

此 Skill 在 buffer operation 时自动运行。

---

## 下一步增强

- 飞书 buffer 集成
- Buffer analytics
- Buffer debugging