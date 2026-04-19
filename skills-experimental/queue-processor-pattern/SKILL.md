# Queue Processor Pattern Skill

Queue Processor Pattern - processQueueIfReady + isSlashCommand check + Bash mode single processing + Mode matching batch + dequeueAllMatching + isMainThread filter。

## 功能概述

从Claude Code的utils/queueProcessor.ts提取的队列处理模式，用于OpenClaw的命令队列系统。

## 核心机制

### processQueueIfReady

```typescript
export function processQueueIfReady({
  executeInput,
}: ProcessQueueParams): ProcessQueueResult {
  const isMainThread = (cmd: QueuedCommand) => cmd.agentId === undefined

  const next = peek(isMainThread)
  if (!next) {
    return { processed: false }
  }
  // Check if queue has items
  // peek next command
  // Return processed status
}
// Process queue when ready
// isMainThread filter
# peek next command
```

### isSlashCommand Check

```typescript
function isSlashCommand(cmd: QueuedCommand): boolean {
  if (typeof cmd.value === 'string') {
    return cmd.value.trim().startsWith('/')
  }
  // For ContentBlockParam[], check first text block
  for (const block of cmd.value) {
    if (block.type === 'text') {
      return block.text.trim().startsWith('/')
    }
  }
  return false
}
// Check if command starts with '/'
// String: trim().startsWith('/')
// ContentBlockParam[]: check first text block
```

### Bash Mode Single Processing

```typescript
// Slash commands and bash-mode commands are processed individually.
// Bash commands need per-command error isolation, exit codes, and progress UI.
if (isSlashCommand(next) || next.mode === 'bash') {
  const cmd = dequeue(isMainThread)!
  void executeInput([cmd])  // Single command array
  return { processed: true }
}
// Slash and bash: process individually
// Bash needs error isolation + exit codes + progress UI
// executeInput([cmd]) single array
```

### Mode Matching Batch

```typescript
// Drain all non-slash-command items with the same mode at once.
const targetMode = next.mode
const commands = dequeueAllMatching(
  cmd => isMainThread(cmd) && !isSlashCommand(cmd) && cmd.mode === targetMode,
)

void executeInput(commands)
return { processed: true }
// Drain all with same mode
// dequeueAllMatching predicate
// Batch to executeInput
```

### dequeueAllMatching

```typescript
const commands = dequeueAllMatching(
  cmd => isMainThread(cmd) && !isSlashCommand(cmd) && cmd.mode === targetMode,
)
// Predicate filtering
// isMainThread + not slash + same mode
// Batch dequeue
```

### isMainThread Filter

```typescript
// This processor runs on REPL main thread between turns. Skip anything
// addressed to a subagent — unfiltered peek() returning subagent notification
// would set targetMode, dequeueAllMatching would find nothing, and queue stalls.
const isMainThread = (cmd: QueuedCommand) => cmd.agentId === undefined
// agentId === undefined: main thread command
// Skip subagent notifications
// Prevent queue stall
```

### Different Modes Never Mixed

```typescript
// Different modes (e.g. prompt vs task-notification) are never mixed
// because they are treated differently downstream.
// Each becomes its own user message with its own UUID.
// Same mode only batched
// Different modes separate
```

## 实现建议

### OpenClaw适配

1. **processQueue**: processQueueIfReady pattern
2. **slashCommandCheck**: isSlashCommand check
3. **bashSingle**: Bash mode single processing
4. **modeMatching**: Mode matching batch
5. **mainThreadFilter**: isMainThread filter

### 状态文件示例

```json
{
  "processed": true,
  "queueLength": 5,
  "targetMode": "prompt",
  "isSlashCommand": false
}
```

## 关键模式

### Single vs Batch Processing

```
Slash/Bash: single → [cmd] | Others: batch → [cmd1, cmd2, ...] same mode
// Slash和Bash单独处理
// 其他command batch处理（同mode）
```

### Mode Matching Predicate

```
dequeueAllMatching(cmd => cmd.mode === targetMode) → batch same mode
// predicate过滤同mode
// batch dequeue
// 不同mode不mixed
```

### isMainThread AgentId Check

```
agentId === undefined → main thread → skip subagent → prevent stall
// agentId检测main thread
// skip subagent notifications
// 防止queue stall
```

### Bash Error Isolation

```
Bash: single processing → error isolation + exit codes + progress UI
// Bash需要单独处理
// 错误隔离
// exit codes保留
// progress UI独立
```

## 借用价值

- ⭐⭐⭐⭐⭐ processQueueIfReady pattern
- ⭐⭐⭐⭐⭐ isSlashCommand check
- ⭐⭐⭐⭐⭐ Bash mode single processing
- ⭐⭐⭐⭐⭐ Mode matching batch pattern
- ⭐⭐⭐⭐ isMainThread filter

## 来源

- Claude Code: `utils/queueProcessor.ts` (96 lines)
- 分析报告: P48-6