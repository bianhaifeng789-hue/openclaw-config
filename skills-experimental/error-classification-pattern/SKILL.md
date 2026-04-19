# Error Classification Pattern Skill

Error Classification Pattern - isAbortError multiple checks + instanceof + Error.name === 'AbortError' + getErrnoCode + isENOENT + isFsInaccessible + classifyAxiosError + kind bucket + status optional + TelemetrySafeError + shortErrorStack + errorMessage + toError。

## 功能概述

从Claude Code的utils/errors.ts提取的Error classification模式，用于OpenClaw的错误分类处理。

## 核心机制

### isAbortError Multiple Checks

```typescript
export function isAbortError(e: unknown): boolean {
  return (
    e instanceof AbortError ||
    e instanceof APIUserAbortError ||
    (e instanceof Error && e.name === 'AbortError')
  )
}
// Multiple abort error checks
# instanceof AbortError (our class)
# instanceof APIUserAbortError (SDK)
# Error.name === 'AbortError' (DOMException)
```

### instanceof + Error.name === 'AbortError'

```typescript
// The SDK class is checked via instanceof because minified builds mangle class names —
// constructor.name becomes something like 'nJT' and the SDK never sets this.name,
// so string matching silently fails in production.
e instanceof APIUserAbortError
// instanceof for minified builds
# constructor.name mangled in production
# string matching fails
# instanceof reliable
```

### getErrnoCode

```typescript
export function getErrnoCode(e: unknown): string | undefined {
  if (e && typeof e === 'object' && 'code' in e && typeof e.code === 'string') {
    return e.code
  }
  return undefined
}
// Extract errno code (ENOENT, EACCES, etc.)
# Replaces (e as NodeJS.ErrnoException).code cast
```

### isENOENT

```typescript
export function isENOENT(e: unknown): boolean {
  return getErrnoCode(e) === 'ENOENT'
}
// Check ENOENT (file/dir does not exist)
# Replaces (e as NodeJS.ErrnoException).code === 'ENOENT'
```

### isFsInaccessible

```typescript
export function isFsInaccessible(e: unknown): e is NodeJS.ErrnoException {
  const code = getErrnoCode(e)
  return (
    code === 'ENOENT' ||   // path does not exist
    code === 'EACCES' ||   // permission denied
    code === 'EPERM' ||    // operation not permitted
    code === 'ENOTDIR' ||  // path component is not a directory
    code === 'ELOOP'       // too many symlink levels
  )
}
// True if path missing/inaccessible/unreachable
# Expected vs unexpected errors
```

### classifyAxiosError

```typescript
export function classifyAxiosError(e: unknown): {
  kind: AxiosErrorKind
  status?: number
  message: string
} {
  const message = errorMessage(e)
  if (!e || typeof e !== 'object' || !('isAxiosError' in e) || !e.isAxiosError) {
    return { kind: 'other', message }
  }
  const err = e as { response?: { status?: number }; code?: string }
  const status = err.response?.status
  if (status === 401 || status === 403) return { kind: 'auth', status, message }
  if (err.code === 'ECONNABORTED') return { kind: 'timeout', status, message }
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return { kind: 'network', status, message }
  }
  return { kind: 'http', status, message }
}
// Classify axios error into buckets
# auth (401/403)
# timeout (ECONNABORTED)
# network (ECONNREFUSED/ENOTFOUND)
# http (other)
# other (not axios)
```

### kind Bucket

```typescript
type AxiosErrorKind =
  | 'auth'      // 401/403 — caller typically sets skipRetry
  | 'timeout'   // ECONNABORTED
  | 'network'   // ECONNREFUSED/ENOTFOUND
  | 'http'      // other axios error (may have status)
  | 'other'     // not an axios error
// Bucket classification
# Different handling per kind
```

### status Optional

```typescript
status?: number
// Optional status code
# May or may not have status
# e.g., network errors have no status
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
// Safe to log to telemetry
# Long name confirms verification
# Separate telemetry message
# No sensitive data (file paths, URLs, code)
```

### shortErrorStack

```typescript
export function shortErrorStack(e: unknown, maxFrames = 5): string {
  if (!(e instanceof Error)) return String(e)
  if (!e.stack) return e.message
  const lines = e.stack.split('\n')
  const header = lines[0] ?? e.message
  const frames = lines.slice(1).filter(l => l.trim().startsWith('at '))
  if (frames.length <= maxFrames) return e.stack
  return [header, ...frames.slice(0, maxFrames)].join('\n')
}
// Extract message + top N stack frames
# Full stack ~500-2000 chars waste tokens
# Keep maxFrames for model
# Full stack in debug logs
```

### errorMessage

```typescript
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
// Extract error message
# Use for logging/display
# When you only need message
```

### toError

```typescript
export function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e))
}
// Normalize to Error instance
# Use at catch-site boundaries
# When you need Error instance
```

## 实现建议

### OpenClaw适配

1. **errorClassification**: classifyAxiosError pattern
2. **errnoHelpers**: getErrnoCode + isENOENT + isFsInaccessible
3. **abortChecks**: isAbortError multiple checks pattern
4. **telemetrySafe**: TelemetrySafeError pattern
5. **shortStack**: shortErrorStack pattern

### 状态文件示例

```json
{
  "kind": "auth",
  "status": 401,
  "message": "Unauthorized",
  "errno": "ENOENT"
}
```

## 关键模式

### Multiple Abort Checks

```
instanceof AbortError | instanceof APIUserAbortError | Error.name === 'AbortError' → multiple checks → catch all abort shapes
# 多种abort error检查
# instanceof + name check
# 覆盖所有abort shapes
```

### instanceof for Minified Builds

```
minified builds → constructor.name = 'nJT' → string matching fails → instanceof reliable → SDK class
# minified builds时constructor.name被mangle
# string matching失败
# instanceof可靠
```

### Errno Helper Functions

```
getErrnoCode(e) → ENOENT/EACCES/EPERM/ENOTDIR/ELOOP → isENOENT/isFsInaccessible → helper functions
# errno helper functions
# 避免手动cast
# 安全的errno check
```

### Axios Error Bucketing

```
401/403 → auth | ECONNABORTED → timeout | ECONNREFUSED/ENOTFOUND → network → bucket classification
# axios error bucketing
# 不同kind不同handling
# auth/timeout/network/http/other
```

### shortErrorStack Token Efficiency

```
full stack ~500-2000 chars → shortErrorStack(e, 5) → header + 5 frames → token efficiency → full stack in debug logs
# shortErrorStack节省tokens
# header + maxFrames
# full stack保留在debug logs
```

## 借用价值

- ⭐⭐⭐⭐⭐ isAbortError multiple checks pattern
- ⭐⭐⭐⭐⭐ instanceof for minified builds pattern
- ⭐⭐⭐⭐⭐ errno helper functions pattern
- ⭐⭐⭐⭐⭐ Axios error bucketing pattern
- ⭐⭐⭐⭐⭐ shortErrorStack token efficiency pattern

## 来源

- Claude Code: `utils/errors.ts` (238 lines)
- 分析报告: P55-2