# Diag Logger Wrapper Pattern

## Source
Claude Code: `utils/telemetry/logger.ts` (ClaudeCodeDiagLogger)

## Pattern
OpenTelemetry DiagLogger interface wrapper - error/warn only, info/debug silenced.

## Code Example
```typescript
import type { DiagLogger } from '@opentelemetry/api'

export class ClaudeCodeDiagLogger implements DiagLogger {
  error(message: string, ..._: unknown[]) {
    logError(new Error(message))
    logForDebugging(`[3P telemetry] OTEL diag error: ${message}`, { level: 'error' })
  }

  warn(message: string, ..._: unknown[]) {
    logError(new Error(message))
    logForDebugging(`[3P telemetry] OTEL diag warn: ${message}`, { level: 'warn' })
  }

  info(_message: string, ..._args: unknown[]) {
    return  // Silenced - no logging
  }

  debug(_message: string, ..._args: unknown[]) {
    return  // Silenced - no logging
  }

  verbose(_message: string, ..._args: unknown[]) {
    return  // Silenced - no logging
  }
}

// Usage in instrumentation.ts:
diag.setLogger(new ClaudeCodeDiagLogger(), DiagLogLevel.ERROR)
```

## Key Concepts
1. **DiagLogger Interface**: OpenTelemetry diagnostic logger
2. **Error/Warn Only**: Only error/warn emit to logError + logForDebugging
3. **Info/Debug/Verbose Silenced**: No logging for lower levels
4. **Dual Logging**: logError for error tracking + logForDebugging for telemetry tag
5. **DiagLogLevel**: ERROR level suppresses warn/info/debug/verbose

## Benefits
- OTel diagnostics visible in error logs
- Lower levels silenced to reduce noise
- 3P telemetry tag for filtering

## When to Use
- OTel SDK diagnostic configuration
- Third-party library logging control
- Error visibility without verbosity

## Related Patterns
- OTel Instrumentation Bootstrap (instrumentation.ts)
- Error Log Sink (errorLogSink.ts)
- Debug Logging (debug.ts)