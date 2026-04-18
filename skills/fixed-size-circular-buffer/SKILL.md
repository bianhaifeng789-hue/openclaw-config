# Fixed-Size Circular Buffer Skill

Fixed-Size Circular Buffer - CircularBuffer class + modulo arithmetic + head pointer + size tracking + add/getRecent/toArray + capacity fixed + oldest evict + rolling window + capacity constructor + buffer array。

## 功能概述

从Claude Code的utils/CircularBuffer.ts提取的Fixed-size circular buffer模式，用于OpenClaw的滚动窗口数据存储。

## 核心机制

### CircularBuffer Class

```typescript
export class CircularBuffer<T> {
  private buffer: T[]
  private head = 0
  private size = 0

  constructor(private capacity: number) {
    this.buffer = new Array(capacity)
  }
  // Fixed-size circular buffer
  // Automatically evicts oldest when full
}
```

### modulo Arithmetic

```typescript
this.head = (this.head + 1) % this.capacity
// Circular pointer wrapping
// Modulo ensures head stays within [0, capacity-1]
# Wrap around
```

### head Pointer

```typescript
private head = 0
// Next write position
// Points to where next item will be inserted
# Write position
```

### size Tracking

```typescript
private size = 0
// Current number of items
// Increases until reaches capacity
# Actual size (<= capacity)
```

### add Method

```typescript
add(item: T): void {
  this.buffer[this.head] = item
  this.head = (this.head + 1) % this.capacity
  if (this.size < this.capacity) {
    this.size++
  }
}
// Add item at head position
// Advance head with modulo
// Increase size until full
```

### getRecent Method

```typescript
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
// Get most recent N items
// start: 0 if not full, head if full
# Calculate correct indices
```

### toArray Method

```typescript
toArray(): T[] {
  if (this.size === 0) return []

  const result: T[] = []
  const start = this.size < this.capacity ? 0 : this.head

  for (let i = 0; i < this.size; i++) {
    const index = (start + i) % this.capacity
    result.push(this.buffer[index]!)
  }
  return result
}
// Get all items in order (oldest to newest)
// start: 0 if not full, head if full
# Chronological order
```

### capacity Fixed

```typescript
constructor(private capacity: number) {
  this.buffer = new Array(capacity)
}
// Fixed capacity
// Array pre-allocated
# No resizing
```

### oldest Evict

```typescript
// Automatically evicts the oldest items when the buffer is full
// Overwrites oldest position when head wraps
# No explicit evict logic
# Just overwrite
```

### rolling Window

```typescript
// Useful for maintaining a rolling window of data
// Recent history tracking
# Rolling window pattern
```

### buffer Array

```typescript
this.buffer = new Array(capacity)
// Pre-allocated array
// No dynamic resizing
# Fixed allocation
```

### start Calculation

```typescript
const start = this.size < this.capacity ? 0 : this.head
// Not full: start from 0 (oldest at index 0)
// Full: start from head (oldest at head position)
# Different logic based on fullness
```

## 实现建议

### OpenClaw适配

1. **circularBuffer**: CircularBuffer class
2. **moduloArithmetic**: modulo arithmetic pattern
3. **addGetRecent**: add + getRecent methods
4. **rollingWindow**: rolling window pattern
5. **startCalculation**: start calculation logic

### 状态文件示例

```json
{
  "capacity": 100,
  "size": 50,
  "head": 50,
  "items": ["item1", "item2"]
}
```

## 关键模式

### Modulo Pointer Wrapping

```
head = (head + 1) % capacity → wrap around → circular → no overflow
# modulo确保pointer wrap
# 不会overflow
# circular loop
```

### Overwrite oldest on Full

```
buffer[head] = item → head advances → wraps → overwrites oldest → automatic evict
# 写入head位置
# head advance
# wrap时覆盖oldest
# 自动evict
```

### start Logic by Fullness

```
size < capacity: start=0 | size == capacity: start=head → different oldest position
# 未满: oldest在index 0
# 已满: oldest在head position
# 不同逻辑
```

### Chronological toArray

```
toArray(): oldest to newest → start + i % capacity → chronological order → not reverse
# toArray oldest→newest顺序
# 按时间顺序排列
# 不是reverse
```

### Pre-Allocated Fixed Array

```
new Array(capacity) → pre-allocated → no resizing → fixed size → no dynamic allocation
# 预分配array
# 不resize
# 固定size
# 无动态allocation
```

## 借用价值

- ⭐⭐⭐⭐⭐ modulo arithmetic pattern
- ⭐⭐⭐⭐⭐ overwrite oldest automatic evict
- ⭐⭐⭐⭐⭐ start calculation by fullness
- ⭐⭐⭐⭐⭐ Chronological toArray pattern
- ⭐⭐⭐⭐⭐ Pre-allocated fixed array

## 来源

- Claude Code: `utils/CircularBuffer.ts` (84 lines)
- 分析报告: P53-2