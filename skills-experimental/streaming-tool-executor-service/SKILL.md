---
name: streaming-tool-executor-service
description: "| Use when [streaming tool executor service] is needed."
  Streaming tool executor service.
  
  Class StreamingToolExecutor:
  - tools: TrackedTool[]
  - toolUseContext: ToolUseContext
  - hasErrored, erroredToolDescription
  - siblingAbortController: AbortController
  - discarded: boolean
  
  TrackedTool:
  - id, block, assistantMessage, status
  - isConcurrencySafe, promise, results
  - pendingProgress, contextModifiers
  
  ToolStatus: 'queued' | 'executing' | 'completed' | 'yielded'
  
  Features:
  - Concurrency control
  - Concurrent-safe tools execute in parallel
  - Non-concurrent tools exclusive access
  - Buffered results emitted in order
  
  Keywords:
  - Service reference - streaming tool executor
metadata:
  openclaw:
    emoji: "🔧"
    source: claude-code-services
    triggers: [streaming-tool-executor]
    priority: P2
---

# Streaming Tool Executor Service

Streaming tool executor服务。

---

来源: Claude Code services/tools/StreamingToolExecutor.ts