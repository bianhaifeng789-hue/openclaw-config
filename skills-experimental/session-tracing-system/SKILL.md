---
name: session-tracing-system
description: |
  Trace session execution for performance analysis and debugging.
  
  Use when:
  - User asks "trace session" or "performance analysis"
  - Debugging slow operations
  - Session replay needed
  - Performance optimization
  
  NOT for:
  - Normal operations (overhead)
  - Privacy-sensitive sessions
  - Short sessions (< 5 turns)
  
  Auto-trigger conditions:
  - Opt-in by user
  - Debug mode enabled
  
  Tracing components:
  - Turn boundaries: when model responds
  - Tool calls: duration, success/failure
  - Hooks: pre/post sampling hooks
  - API calls: latency, retries
  - Permission checks: duration
  
  Keywords (require explicit mention):
  - "trace", "performance", "debug session", "追踪", "性能分析"
metadata:
  openclaw:
    emoji: "🔍"
    source: claude-code-core
    triggers: [explicit-request, debug-mode]
    priority: P1
    autoTrigger: false
    feishuCard: true
---

# Session Tracing System

会话追踪系统。

## 追踪维度

### Turn追踪
```typescript
{
  turnId: 'turn-1',
  startTime: 1744449000,
  endTime: 1744449500,
  duration: 500ms,
  modelResponse: '...',
  toolCalls: 3,
  hooksExecuted: 5
}
```

### Tool追踪
```typescript
{
  toolName: 'BashTool',
  startTime: 1744449100,
  endTime: 1744449200,
  duration: 100ms,
  success: true,
  input: 'ls -la',
  output: '...'
}
```

### Hook追踪
```typescript
{
  hookName: 'postSamplingHook',
  startTime: 1744449150,
  endTime: 1744449180,
  duration: 30ms
}
```

## Perfetto格式

支持导出为Perfetto格式：
```
https://ui.perfetto.dev/
```

---

来源: Claude Code utils/telemetry/sessionTracing.ts + perfettoTracing.ts