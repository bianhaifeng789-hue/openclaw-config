---
name: errors-utils
description: "Error handling utilities. ClaudeError + MalformedCommandError + AbortError + ConfigParseError + ShellError + TeleportOperationError + TelemetrySafeError + isAbortError + hasExactErrorMessage + toError + errorMessage + getErrnoCode + isENOENT + getErrnoPath. Use when [errors utils] is needed."
metadata:
  openclaw:
    emoji: "⚠️"
    triggers: [error-handling, errno]
    feishuCard: true
---

# Errors Utils Skill - Errors Utils

Errors Utils 错误处理工具。

## 为什么需要这个？

**场景**：
- Custom error classes
- Abort error detection
- errno extraction
- Telemetry safe errors
- Error normalization

**Claude Code 方案**：errors.ts + 239+ lines
**OpenClaw 飞书适配**：Errors utils + Error handling

---

## Error Classes

### ClaudeError

```typescript
export class ClaudeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
```

### MalformedCommandError

```typescript
export class MalformedCommandError extends Error {}
```

### AbortError

```typescript
export class AbortError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'AbortError'
  }
}
```

### ConfigParseError

```typescript
export class ConfigParseError extends Error {
  filePath: string
  defaultConfig: unknown

  constructor(message: string, filePath: string, defaultConfig: unknown) {
    super(message)
    this.name = 'ConfigParseError'
    this.filePath = filePath
    this.defaultConfig = defaultConfig
  }
}
```

### ShellError

```typescript
export class ShellError extends Error {
  constructor(
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly code: number,
    public readonly interrupted: boolean,
  ) {
    super('Shell command failed')
    this.name = 'ShellError'
  }
}
```

### TeleportOperationError

```typescript
export class TeleportOperationError extends Error {
  constructor(
    message: string,
    public readonly formattedMessage: string,
  ) {
    super(message)
    this.name = 'TeleportOperationError'
  }
}
```

### TelemetrySafeError

```typescript
export class TelemetrySafeError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS extends Error {
  readonly telemetryMessage: string

  constructor(message: string, telemetryMessage?: string) {
    super(message)
    this.name = 'TelemetrySafeError'
    this.telemetryMessage = telemetryMessage ?? message
  }
}
```

---

## Functions

### 1. isAbortError

```typescript
export function isAbortError(e: unknown): boolean {
  return (
    e instanceof AbortError ||
    e instanceof APIUserAbortError ||
    (e instanceof Error && e.name === 'AbortError')
  )
}
```

### 2. hasExactErrorMessage

```typescript
export function hasExactErrorMessage(error: unknown, message: string): boolean {
  return error instanceof Error && error.message === message
}
```

### 3. toError

```typescript
export function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e))
}
```

### 4. errorMessage

```typescript
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
```

### 5. getErrnoCode

```typescript
export function getErrnoCode(e: unknown): string | undefined {
  if (e && typeof e === 'object' && 'code' in e && typeof e.code === 'string') {
    return e.code
  }
  return undefined
}
```

### 6. isENOENT

```typescript
export function isENOENT(e: unknown): boolean {
  return getErrnoCode(e) === 'ENOENT'
}
```

### 7. getErrnoPath

```typescript
export function getErrnoPath(e: unknown): string | undefined {
  if (e && typeof e === 'object' && 'path' in e && typeof e.path === 'string') {
    return e.path
  }
  return undefined
}
```

---

## 飞书卡片格式

### Errors Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚠️ Errors Utils**\n\n---\n\n**Error Classes**：\n• ClaudeError\n• MalformedCommandError\n• AbortError\n• ConfigParseError\n• ShellError\n• TeleportOperationError\n• TelemetrySafeError\n\n---\n\n**Functions**：\n• isAbortError()\n• hasExactErrorMessage()\n• toError()\n• errorMessage()\n• getErrnoCode()\n• isENOENT()\n• getErrnoPath()"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/errors-utils-state.json
{
  "stats": {
    "totalErrors": 0,
    "abortErrors": 0
  },
  "lastUpdate": "2026-04-12T12:37:00Z",
  "notes": "Errors Utils Skill 创建完成。"
}