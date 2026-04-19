---
name: slow-operations
description: "Slow operation monitoring. SLOW_OPERATION_THRESHOLD_MS (20ms dev/300ms ant) + AntSlowLogger + slowLogging tagged template + jsonStringify + cloneDeep + Caller frame extraction + Re-entrancy guard + dispose pattern. Use when [slow operations] is needed."
metadata:
  openclaw:
    emoji: "⏱️"
    triggers: [slow-ops, performance-monitor]
    feishuCard: true
---

# Slow Operations Skill - Slow Operations

Slow Operations 慢操作监控。

## 为什么需要这个？

**场景**：
- Monitor slow JSON/clone operations
- Performance debugging
- Caller frame extraction
- Threshold-based logging
- Re-entrancy guard

**Claude Code 方案**：slowOperations.ts + 290+ lines
**OpenClaw 飞书适配**：Slow operations + Performance monitoring

---

## Thresholds

```typescript
const SLOW_OPERATION_THRESHOLD_MS = (() => {
  const envValue = process.env.CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS
  if (envValue !== undefined) {
    const parsed = Number(envValue)
    if (!Number.isNaN(parsed) && parsed >= 0) return parsed
  }
  
  if (process.env.NODE_ENV === 'development') return 20
  if (process.env.USER_TYPE === 'ant') return 300
  return Infinity
})()
```

---

## AntSlowLogger

```typescript
class AntSlowLogger {
  startTime: number
  args: IArguments
  err: Error

  constructor(args: IArguments) {
    this.startTime = performance.now()
    this.args = args
    this.err = new Error() // Stack capture at construction
  }

  [Symbol.dispose](): void {
    const duration = performance.now() - this.startTime
    if (duration > SLOW_OPERATION_THRESHOLD_MS && !isLogging) {
      isLogging = true
      try {
        const description = buildDescription(this.args) + callerFrame(this.err.stack)
        logForDebugging(`[SLOW OPERATION DETECTED] ${description} (${duration.toFixed(1)}ms)`)
        addSlowOperation(description, duration)
      } finally {
        isLogging = false
      }
    }
  }
}
```

---

## Functions

### 1. Caller Frame

```typescript
export function callerFrame(stack: string | undefined): string {
  if (!stack) return ''
  
  for (const line of stack.split('\n')) {
    if (line.includes('slowOperations')) continue
    
    const m = line.match(/([^/\\]+?):(\d+):\d+\)?$/)
    if (m) return ` @ ${m[1]}:${m[2]}`
  }
  
  return ''
}
```

### 2. Build Description

```typescript
function buildDescription(args: IArguments): string {
  const strings = args[0] as TemplateStringsArray
  let result = ''
  
  for (let i = 0; i < strings.length; i++) {
    result += strings[i]
    
    if (i + 1 < args.length) {
      const v = args[i + 1]
      if (Array.isArray(v)) {
        result += `Array[${(v as unknown[]).length}]`
      } else if (v !== null && typeof v === 'object') {
        result += `Object{${Object.keys(v as Record<string, unknown>).length} keys}`
      } else if (typeof v === 'string') {
        result += v.length > 80 ? `${v.slice(0, 80)}…` : v
      } else {
        result += String(v)
      }
    }
  }
  
  return result
}
```

---

## 飞书卡片格式

### Slow Operations 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏱️ Slow Operations**\n\n---\n\n**Thresholds**：\n• Dev: 20ms\n• Ant: 300ms\n• Env override: CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS\n\n---\n\n**Patterns**：\n• AntSlowLogger[Symbol.dispose]\n• Caller frame extraction\n• Re-entrancy guard\n• Tagged template\n\n---\n\n**Functions**：\n• jsonStringify()\n• cloneDeep()\n• writeFileSync_DEPRECATED()"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/slow-operations-state.json
{
  "stats": {
    "slowOpsDetected": 0,
    "thresholdMs": 300
  },
  "lastUpdate": "2026-04-12T11:15:00Z",
  "notes": "Slow Operations Skill 创建完成。"
}