# Stream Class Skill

Stream Class - AsyncIterator implementation + queue + readResolve/readReject + enqueue/done/error + single iteration + Promise-based read + isDone/hasError flags。

## 功能概述

从Claude Code的utils/stream.ts提取的Stream类模式，用于OpenClaw的异步流处理。

## 核心机制

### Stream Class

```typescript
export class Stream<T> implements AsyncIterator<T> {
  private readonly queue: T[] = []
  private readResolve?: (value: IteratorResult<T>) => void
  private readReject?: (error: unknown) => void
  private isDone: boolean = false
  private hasError: unknown | undefined
  private started = false

  constructor(private readonly returned?: () => void) {}
  // AsyncIterator implementation
  // queue for buffered items
  // readResolve/readReject for pending reads
  // isDone/hasError state flags
}
```

### AsyncIterator Interface

```typescript
[Symbol.asyncIterator](): AsyncIterableIterator<T> {
  if (this.started) {
    throw new Error('Stream can only be iterated once')
  }
  this.started = true
  return this
}

next(): Promise<IteratorResult<T, unknown>> {
  // ...
}
// AsyncIterator interface
// Single iteration (started flag)
// next() returns Promise
```

### next() Implementation

```typescript
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
// Queue has items → immediate resolve
// isDone → done: true
// hasError → reject
// Otherwise → pending Promise
```

### enqueue

```typescript
enqueue(value: T): void {
  if (this.readResolve) {
    // Pending read waiting → resolve immediately
    const resolve = this.readResolve
    this.readResolve = undefined
    this.readReject = undefined
    resolve({ done: false, value })
  } else {
    // No pending read → buffer in queue
    this.queue.push(value)
  }
}
// Pending read → resolve immediately
// No pending read → buffer
// Zero-copy when possible
```

### done

```typescript
done() {
  this.isDone = true
  if (this.readResolve) {
    const resolve = this.readResolve
    this.readResolve = undefined
    this.readReject = undefined
    resolve({ done: true, value: undefined })
  }
}
// Mark stream done
// Resolve pending read with done: true
```

### error

```typescript
error(error: unknown) {
  this.hasError = error
  if (this.readReject) {
    const reject = this.readReject
    this.readResolve = undefined
    this.readReject = undefined
    reject(error)
  }
}
// Set error state
// Reject pending read
```

### return

```typescript
return(): Promise<IteratorResult<T, unknown>> {
  this.isDone = true
  if (this.returned) {
    this.returned()  // Cleanup callback
  }
  return Promise.resolve({ done: true, value: undefined })
}
// Cleanup on return
// returned callback
```

## 实现建议

### OpenClaw适配

1. **streamClass**: Stream<T> class
2. **asyncIterator**: AsyncIterator implementation
3. **readResolve**: Pending read pattern
4. **enqueueDoneError**: enqueue/done/error methods
5. **singleIteration**: started flag (single iteration)

### 状态文件示例

```json
{
  "queueLength": 3,
  "isDone": false,
  "hasError": null,
  "started": true
}
```

## 关键模式

### Pending Read Pattern

```
readResolve/readReject → pending Promise → enqueue resolves → zero-copy
// pending read等待enqueue
// enqueue时立即resolve
// 无需buffer（zero-copy）
```

### Queue Buffering

```
queue.push(value) → no pending read → buffer → next() shifts
// 无pending read时buffer
// next()时shift queue
// 先enqueue后read场景
```

### Single Iteration

```
started flag → throw if iterated twice → single use stream
// Stream只能迭代一次
// started flag检测
// throw on second iteration
```

### Error State

```
hasError → reject pending read → future next() rejects
// error状态持久
// pending read reject
// future next()也reject
```

### Cleanup Callback

```
returned?: () => void → return() calls cleanup → dispose pattern
// return()时cleanup
// optional cleanup callback
// dispose pattern
```

## 借用价值

- ⭐⭐⭐⭐⭐ Stream<T> AsyncIterator implementation
- ⭐⭐⭐⭐⭐ Pending read pattern (readResolve/readReject)
- ⭐⭐⭐⭐⭐ enqueue/done/error methods
- ⭐⭐⭐⭐⭐ Zero-copy when pending read
- ⭐⭐⭐⭐ Single iteration protection

## 来源

- Claude Code: `utils/stream.ts` (76 lines)
- 分析报告: P48-4