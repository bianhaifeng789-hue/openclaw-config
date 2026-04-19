# Diagnostic Logs Skill

**优先级**: P29
**来源**: Claude Code `diagLogs.ts`
**适用场景**: 监控日志、诊断追踪

---

## 概述

Diagnostic Logs将诊断信息写入JSONL日志文件，用于容器内监控和问题追踪。支持计时包装函数，自动记录started/completed/failed事件。

---

## 核心功能

### 1. JSONL日志写入

```typescript
type DiagnosticLogLevel = 'debug' | 'info' | 'warn' | 'error'

type DiagnosticLogEntry = {
  timestamp: string
  level: DiagnosticLogLevel
  event: string
  data: Record<string, unknown>
}

export function logForDiagnosticsNoPII(
  level: DiagnosticLogLevel,
  event: string,
  data?: Record<string, unknown>
): void
```

### 2. 计时包装

```typescript
export async function withDiagnosticsTiming<T>(
  event: string,
  fn: () => Promise<T>,
  getData?: (result: T) => Record<string, unknown>
): Promise<T>
```

---

## 实现要点

### 1. 无PII原则

```typescript
/**
 * Important - this function MUST NOT be called with any PII, including
 * file paths, project names, repo names, prompts, etc.
 */
export function logForDiagnosticsNoPII(...): void {
  const entry: DiagnosticLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    data: data ?? {}
  }
  
  // JSONL格式写入
  const line = jsonStringify(entry) + '\n'
  fs.appendFileSync(logFile, line)
}
```

### 2. 计时逻辑

```typescript
export async function withDiagnosticsTiming<T>(...): Promise<T> {
  const startTime = Date.now()
  logForDiagnosticsNoPII('info', `${event}_started`)
  
  try {
    const result = await fn()
    const additionalData = getData ? getData(result) : {}
    logForDiagnosticsNoPII('info', `${event}_completed`, {
      duration_ms: Date.now() - startTime,
      ...additionalData
    })
    return result
  } catch (error) {
    logForDiagnosticsNoPII('error', `${event}_failed`, {
      duration_ms: Date.now() - startTime
    })
    throw error
  }
}
```

### 3. Env配置

```typescript
// 日志文件路径由环境变量指定
function getDiagnosticLogFile(): string | undefined {
  return process.env.CLAUDE_CODE_DIAGNOSTICS_FILE
}
```

---

## OpenClaw应用

### 1. 飞书监控日志

```typescript
// OpenClaw扩展：飞书诊断日志
const OPENCLAW_DIAGNOSTICS_FILE = process.env.OPENCLAW_DIAGNOSTICS_FILE

logForDiagnosticsNoPII('info', 'feishu_card_sent', {
  cardType: 'progress',
  recipient: 'user_id'
})

logForDiagnosticsNoPII('error', 'feishu_api_error', {
  error: errorMessage,
  endpoint: '/api/card/send'
})
```

### 2. 性能追踪

```typescript
// 包装API调用计时
const result = await withDiagnosticsTiming('feishu_message_send', async () => {
  return await feishuApi.sendMessage(...)
}, (result) => ({
  messageId: result.message_id,
  cardType: result.card_type
}))
```

---

## 状态文件

```json
{
  "skill": "diagnostic-logs",
  "priority": "P29",
  "source": "diagLogs.ts",
  "enabled": true,
  "logLevels": ["debug", "info", "warn", "error"],
  "logFile": null,
  "eventsLogged": 0,
  "lastEvent": null,
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `diagLogs.ts`