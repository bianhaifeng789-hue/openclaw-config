---
name: streaming-tool-executor
description: |
  Concurrent tool execution engine. Execute concurrent-safe tools in parallel, serialize non-concurrent tools, buffer results in order.
  
  Use when:
  - Multiple tool calls in a single assistant turn
  - Need to parallelize read-only operations (file reads, searches)
  - Bash errors should abort sibling tool processes
  - Streaming tool results as they complete
  
  Keywords: parallel tools, concurrent execution, tool queue, streaming results
metadata:
  openclaw:
    emoji: "⚡"
    source: claude-code-streaming-tool-executor
    triggers: [multi-tool, parallel-execution, tool-concurrency]
    priority: P1
---

# Streaming Tool Executor

基于 Claude Code `StreamingToolExecutor` 的并发工具执行引擎。

## 核心架构（来自 Claude Code）

```typescript
class StreamingToolExecutor {
  private tools: TrackedTool[]          // 工具队列
  private siblingAbortController        // Bash 出错时中止兄弟进程
  
  addTool(block, assistantMessage)      // 加入队列，立即开始执行
  async *getRemainingResults()          // 按顺序 yield 结果
  discard()                             // 丢弃所有待执行工具（流式回退时用）
}
```

### 并发安全分类

```
isConcurrencySafe = true  → 可与其他 safe 工具并行执行
  - FileRead, Glob, Grep, WebFetch, WebSearch
  - 所有只读操作

isConcurrencySafe = false → 必须独占执行（等待所有并行工具完成）
  - Bash（有副作用）
  - FileWrite, FileEdit
  - AgentTool
```

### 执行策略

```
processQueue():
  1. 找出所有 queued 工具
  2. 如果有 non-concurrent 工具：
     - 等待所有 executing 工具完成
     - 独占执行该工具
  3. 如果全是 concurrent-safe：
     - 并行启动所有 queued 工具
  4. Bash 出错 → 触发 siblingAbortController → 中止其他进程
```

### 结果顺序保证

```
工具按接收顺序 yield 结果，即使并行执行：
  Tool A (slow read) ──────────────→ result A
  Tool B (fast read) ──→ result B (buffered until A done)
  Tool C (bash)      ────────────────────→ result C

输出顺序: A → B → C  (不是 B → A → C)
```

## OpenClaw 适配实现

### 简化版并发执行

```javascript
async function executeToolsConcurrently(toolCalls) {
  const safe = toolCalls.filter(t => isConcurrencySafe(t))
  const unsafe = toolCalls.filter(t => !isConcurrencySafe(t))
  
  const results = new Map()
  
  // 并行执行 safe 工具
  if (safe.length > 0) {
    const safeResults = await Promise.all(
      safe.map(t => executeTool(t).then(r => [t.id, r]))
    )
    safeResults.forEach(([id, r]) => results.set(id, r))
  }
  
  // 串行执行 unsafe 工具
  for (const tool of unsafe) {
    results.set(tool.id, await executeTool(tool))
  }
  
  // 按原始顺序返回
  return toolCalls.map(t => results.get(t.id))
}
```

### Bash 错误传播

```javascript
// Bash 工具出错时，中止同批次其他工具
const abortController = new AbortController()

async function executeBashTool(cmd, signal) {
  try {
    return await runBash(cmd, { signal })
  } catch (err) {
    abortController.abort()  // 中止兄弟进程
    throw err
  }
}
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 并发控制 | 精细的 queued/executing/completed 状态机 | Promise.all + 串行 fallback |
| 进度消息 | 实时 yield progress | 批次完成后汇报 |
| 流式接收 | 工具边流入边执行 | 批次完成后执行 |
| 最大并发 | `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`（默认 10） | 无限制（Promise.all） |
