# Queue Processor Skill

**优先级**: P30
**来源**: Claude Code `queueProcessor.ts`
**适用场景**: 命令队列处理、批处理优化

---

## 概述

Queue Processor处理命令队列，slash commands单独处理，不同mode命令批处理。优化执行效率。

---

## 核心功能

### 1. Slash Command检测

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
```

### 2. 队列处理

```typescript
export function processQueueIfReady({
  executeInput
}): ProcessQueueResult {
  const next = peek(isMainThread)
  if (!next) return { processed: false }

  // Slash commands and bash-mode: process individually
  if (isSlashCommand(next) || next.mode === 'bash') {
    const cmd = dequeue(isMainThread)
    void executeInput([cmd])
    return { processed: true }
  }

  // Drain all items with same mode at once
  const targetMode = next.mode
  const commands = dequeueAllMatching(
    cmd => isMainThread(cmd) && !isSlashCommand(cmd) && cmd.mode === targetMode
  )
  void executeInput(commands)
  return { processed: true }
}
```

---

## OpenClaw应用

### 1. 飞书消息队列

```typescript
// 处理飞书消息队列
// /command 单独处理
// 其他消息批处理（同mode）
```

---

## 状态文件

```json
{
  "skill": "queue-processor",
  "priority": "P30",
  "source": "queueProcessor.ts",
  "enabled": true,
  "slashCommandIndividual": true,
  "modeBatchProcessing": true,
  "createdAt": "2026-04-12T13:30:00Z"
}
```

---

## 参考

- Claude Code: `queueProcessor.ts`