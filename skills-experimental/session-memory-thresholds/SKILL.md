---
name: session-memory-thresholds
description: |
  Session memory extraction threshold management. Track when to initialize and update session memory based on token count growth and tool call count.
  
  Use when:
  - Deciding when to trigger session memory extraction
  - Tracking context growth between memory updates
  - Implementing adaptive memory extraction timing
  
  Keywords: session memory, extraction threshold, token threshold, memory update timing
metadata:
  openclaw:
    emoji: "🧠"
    source: claude-code-session-memory-utils
    triggers: [session-memory, extraction-threshold, memory-timing]
    priority: P1
---

# Session Memory Thresholds

基于 Claude Code `services/SessionMemory/sessionMemoryUtils.ts` 的会话记忆提取阈值管理。

## 核心配置（来自 Claude Code）

```typescript
const DEFAULT_SESSION_MEMORY_CONFIG = {
  minimumMessageTokensToInit: 10000,   // 初始化阈值：10k tokens
  minimumTokensBetweenUpdate: 5000,    // 更新间隔：5k tokens 增长
  toolCallsBetweenUpdates: 3,          // 工具调用间隔：3次
}
```

## 触发逻辑

### 初始化触发
```
当前 context tokens >= 10000 → 首次提取 session memory
```

### 更新触发（满足任一条件）
```
条件 A: 自上次提取后 token 增长 >= 5000
条件 B: 自上次提取后工具调用次数 >= 3
```

### 等待机制
```
提取进行中时：等待最多 15 秒
提取超过 1 分钟未完成：视为过期，不再等待
```

## OpenClaw 适配实现

### 状态追踪（memory/session-memory-state.json）
```json
{
  "lastSummarizedMessageId": "msg_xxx",
  "tokensAtLastExtraction": 15000,
  "sessionMemoryInitialized": true,
  "extractionStartedAt": null,
  "config": {
    "minimumMessageTokensToInit": 10000,
    "minimumTokensBetweenUpdate": 5000,
    "toolCallsBetweenUpdates": 3
  }
}
```

### 检查是否应该提取

```javascript
function hasMetInitializationThreshold(currentTokenCount) {
  return currentTokenCount >= config.minimumMessageTokensToInit
}

function hasMetUpdateThreshold(currentTokenCount) {
  const tokenGrowth = currentTokenCount - tokensAtLastExtraction
  return tokenGrowth >= config.minimumTokensBetweenUpdate
}

function shouldExtractSessionMemory(currentTokenCount, toolCallsSinceLastExtraction) {
  // 未初始化：检查初始化阈值
  if (!sessionMemoryInitialized) {
    return hasMetInitializationThreshold(currentTokenCount)
  }
  
  // 已初始化：检查更新阈值
  return (
    hasMetUpdateThreshold(currentTokenCount) ||
    toolCallsSinceLastExtraction >= config.toolCallsBetweenUpdates
  )
}
```

### 提取流程

```javascript
async function triggerSessionMemoryExtraction(messages) {
  // 标记开始
  markExtractionStarted()
  
  try {
    // 运行提取（后台 subagent）
    const summary = await extractMemoriesFromMessages(messages)
    
    // 写入 session memory 文件
    await writeFile('memory/session-memory.md', summary)
    
    // 更新状态
    recordExtractionTokenCount(currentTokenCount)
    setLastSummarizedMessageId(lastMessageId)
    markSessionMemoryInitialized()
  } finally {
    markExtractionCompleted()
  }
}
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 状态存储 | 进程内变量 | memory/session-memory-state.json |
| 等待机制 | sleep 轮询 | 文件锁检查 |
| 提取执行 | runForkedAgent | sessions_spawn subagent |
| token 计数 | API 响应中的实际 token | 估算（chars/4） |
