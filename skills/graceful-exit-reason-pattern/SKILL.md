# Graceful Exit Reason Pattern Skill

Graceful Exit Reason Pattern - ExitReason type + gracefulShutdown function + reason string + 'user-interrupt'/'normal'/'error'/'timeout'/'drain-scroll' + code mapping + exitMessage + logEvent analytics + forceExit fallback + retry shutdown + setTimeout delay + lastRequest wait + session persistence。

## 功能概述

从Claude Code的utils/gracefulShutdown.ts提取的Graceful exit reason模式，用于OpenClaw的退出原因追踪。

## 核心机制

### ExitReason Type

```typescript
type ExitReason =
  | 'user-interrupt'  // Ctrl+C
  | 'normal'          // Successful completion
  | 'error'           // Error exit
  | 'timeout'         // Timeout
  | 'drain-scroll'    // Scroll drain exit
// Exit reason classification
```

### gracefulShutdown Function

```typescript
export async function gracefulShutdown(
  reason: ExitReason = 'normal',
  code: number = 0,
): Promise<void> {
  // Cleanup and exit gracefully
}
// Graceful shutdown with reason
```

### reason String

```typescript
gracefulShutdown('user-interrupt', 1)  // Ctrl+C
gracefulShutdown('normal', 0)          // Success
gracefulShutdown('error', 1)           // Error
// Reason string for analytics
```

### 'user-interrupt'/'normal'/'error'/'timeout'/'drain-scroll'

```typescript
// Different exit reasons
// user-interrupt: SIGINT (Ctrl+C)
// normal: successful completion
// error: error exit
// timeout: timeout exit
// drain-scroll: scroll draining exit
```

### code Mapping

```typescript
gracefulShutdown('user-interrupt', 1)  // Exit code 1
gracefulShutdown('normal', 0)          // Exit code 0
gracefulShutdown('error', 1)           // Exit code 1
// Exit code mapping
```

### exitMessage

```typescript
const exitMessage = getExitMessage(reason)
// Message for user display
# Different messages per reason
```

### logEvent Analytics

```typescript
logEvent('tengu_session_exit', {
  reason: reason as AnalyticsMetadata,
  exit_code: code,
  // ... more metadata
})
// Analytics logging on exit
# Track exit reasons
```

### forceExit Fallback

```typescript
// Fallback to forceExit after timeout
setTimeout(() => {
  logForDebugging('gracefulShutdown timeout, forcing exit')
  forceExit(code)
}, 5000)
// Force exit after 5s timeout
# Graceful → force fallback
```

### retry Shutdown

```typescript
// Retry shutdown if last request pending
if (getLastMainRequestId()) {
  await sleep(100)
  // Retry
}
// Wait for pending requests
# Retry shutdown
```

### setTimeout Delay

```typescript
setTimeout(() => forceExit(code), 5000)
// Delay before force exit
# Allow cleanup to complete
```

### lastRequest Wait

```typescript
// Wait for last main request
if (getLastMainRequestId()) {
  // Wait
}
// Wait for pending requests
# Don't exit mid-request
```

### session Persistence

```typescript
if (!isSessionPersistenceDisabled()) {
  // Persist session
}
// Session persistence on exit
# Resume capability
```

## 实现建议

### OpenClaw适配

1. **exitReasonType**: ExitReason type
2. **gracefulShutdown**: gracefulShutdown function
3. **reasonAnalytics**: reason string for analytics
4. **forceFallback**: forceExit fallback pattern
5. **lastRequestWait**: last request wait pattern

### 状态文件示例

```json
{
  "reason": "normal",
  "code": 0,
  "analyticsSent": true,
  "forceTimeout": 5000
}
```

## 关键模式

### ExitReason Classification

```
user-interrupt | normal | error | timeout | drain-scroll → reason classification → analytics
# ExitReason分类
# 不同原因
# analytics tracking
```

### graceful → force Fallback

```
gracefulShutdown → timeout 5s → forceExit → fallback → cleanup may not complete
# graceful shutdown
# 5秒timeout
# forceExit fallback
```

### Analytics on Exit

```
logEvent('session_exit', {reason, code}) → analytics → track exit patterns → improve UX
# exit时log analytics
# track exit patterns
# improve UX
```

### Wait for Last Request

```
lastRequest pending → sleep → retry → don't exit mid-request → complete request
# last request pending时等待
# 不在request中途exit
# 完成request
```

### Session Persistence Option

```
!isSessionPersistenceDisabled → persist session → resume capability → save state
# session persistence选项
# resume capability
# save state on exit
```

## 借用价值

- ⭐⭐⭐⭐⭐ ExitReason classification pattern
- ⭐⭐⭐⭐⭐ graceful → force fallback pattern
- ⭐⭐⭐⭐⭐ Analytics on exit pattern
- ⭐⭐⭐⭐ Wait for last request pattern
- ⭐⭐⭐⭐ Session persistence option pattern

## 来源

- Claude Code: `utils/gracefulShutdown.ts` (529 lines)
- 分析报告: P53-6