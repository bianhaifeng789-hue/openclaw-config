# Deferred Flush BufferedWriter Skill

Deferred Flush BufferedWriter - createBufferedWriter + flushIntervalMs + maxBufferSize + maxBufferBytes + flushDeferred setImmediate + pendingOverflow coalesce + immediateMode bypass + buffer array + writeFn inject + flush clearTimer + dispose drain + overflow detach。

## 功能概述

从Claude Code的utils/bufferedWriter.ts提取的Deferred flush bufferedWriter模式，用于OpenClaw的批量写入优化。

## 核心机制

### createBufferedWriter

```typescript
export function createBufferedWriter({
  writeFn,
  flushIntervalMs = 1000,
  maxBufferSize = 100,
  maxBufferBytes = Infinity,
  immediateMode = false,
}): BufferedWriter
// Factory function
# writeFn injected
# Configurable thresholds
```

### flushIntervalMs

```typescript
flushIntervalMs = 1000
// Timer-based flush every 1000ms
# Periodic flush
```

### maxBufferSize

```typescript
maxBufferSize = 100
// Flush when buffer.length >= 100
# Count threshold
```

### maxBufferBytes

```typescript
maxBufferBytes = Infinity
// Flush when bufferBytes >= maxBufferBytes
# Bytes threshold
```

### flushDeferred setImmediate

```typescript
function flushDeferred(): void {
  // ...
  pendingOverflow = detached
  setImmediate(() => {
    const toWrite = pendingOverflow
    pendingOverflow = null
    if (toWrite) writeFn(toWrite.join(''))
  })
}
// Deferred flush with setImmediate
# Non-blocking
# writeFn may block (appendFileSync)
# Deferring keeps tick short
```

### pendingOverflow Coalesce

```typescript
if (pendingOverflow) {
  // A previous overflow write is still queued. Coalesce into it to preserve ordering.
  pendingOverflow.push(...buffer)
  buffer = []
  bufferBytes = 0
  return
}
// Coalesce into pending overflow
# Preserve ordering
# Batch writes
```

### immediateMode Bypass

```typescript
if (immediateMode) {
  writeFn(content)  // Bypass buffer
  return
}
// Immediate mode: no buffering
# Direct write
```

### buffer Array

```typescript
let buffer: string[] = []
let bufferBytes = 0
// String array buffer
# Track bytes separately
```

### writeFn Injected

```typescript
writeFn: WriteFn
// Injected write function
# Dependency injection
# Allows different write targets
```

### flush clearTimer

```typescript
function flush(): void {
  if (pendingOverflow) {
    writeFn(pendingOverflow.join(''))
    pendingOverflow = null
  }
  if (buffer.length === 0) return
  writeFn(buffer.join(''))
  buffer = []
  bufferBytes = 0
  clearTimer()
}
// Flush buffer and pendingOverflow
# Clear timer
# Reset buffer
```

### dispose Drain

```typescript
dispose(): void {
  flush()
}
// Dispose: drain all buffers
# Cleanup on shutdown
```

### overflow Detach

```typescript
// Detach the buffer synchronously so the caller never waits on writeFn.
// writeFn may block (e.g. errorLogSink.ts appendFileSync) — if overflow fires
// mid-render or mid-keystroke, deferring the write keeps the current tick short.
const detached = buffer
buffer = []
bufferBytes = 0
// Detach buffer synchronously
# Caller never waits
# writeFn deferred
```

## 实现建议

### OpenClaw适配

1. **deferredFlush**: flushDeferred setImmediate pattern
2. **pendingCoalesce**: pendingOverflow coalesce pattern
3. **bufferThresholds**: maxBufferSize + maxBufferBytes thresholds
4. **writeFnInject**: writeFn injected pattern
5. **overflowDetach**: overflow detach pattern

### 状态文件示例

```json
{
  "bufferLength": 50,
  "bufferBytes": 1024,
  "pendingOverflow": ["content1", "content2"],
  "flushIntervalMs": 1000
}
```

## 关键模式

### setImmediate Deferred Write

```
setImmediate(() => writeFn()) → deferred → non-blocking → caller never waits on writeFn
# setImmediate deferred write
# 非阻塞
# caller不等待writeFn
```

### pendingOverflow Coalesce

```
pendingOverflow exists → push(...buffer) → coalesce → preserve ordering → batch writes
# pendingOverflow存在时coalesce
# preserve ordering
# batch writes
```

### Detach Buffer Synchronously

```
const detached = buffer → buffer = [] → detached → write later → caller never waits
# 同步detach buffer
# buffer清空
# detached稍后write
# caller不等待
```

### Double Thresholds

```
buffer.length >= maxBufferSize | bufferBytes >= maxBufferBytes → overflow → two thresholds
# 双threshold触发overflow
# count threshold
# bytes threshold
```

### Immediate Mode Bypass

```
immediateMode=true → writeFn(content) directly → no buffer → bypass buffering
# immediateMode直接write
# 不buffer
# bypass buffering
```

## 借用价值

- ⭐⭐⭐⭐⭐ setImmediate deferred write pattern
- ⭐⭐⭐⭐⭐ pendingOverflow coalesce pattern
- ⭐⭐⭐⭐⭐ Detach buffer synchronously pattern
- ⭐⭐⭐⭐⭐ Double thresholds (count + bytes)
- ⭐⭐⭐⭐⭐ Immediate mode bypass pattern

## 来源

- Claude Code: `utils/bufferedWriter.ts` (100 lines)
- 分析报告: P53-4