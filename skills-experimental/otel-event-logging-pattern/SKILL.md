# OTel Event Logging Pattern

## Source
Claude Code: `utils/telemetry/events.ts` (logOTelEvent)

## Pattern
OpenTelemetry log record emission with sequence counter + prompt ID correlation.

## Code Example
```typescript
let eventSequence = 0  // Monotonically increasing for ordering
let hasWarnedNoEventLogger = false

export function redactIfDisabled(content: string): string {
  return isEnvTruthy(process.env.OTEL_LOG_USER_PROMPTS) ? content : '<REDACTED>'
}

export async function logOTelEvent(
  eventName: string,
  metadata: { [key: string]: string | undefined } = {},
): Promise<void> {
  const eventLogger = getEventLogger()
  if (!eventLogger) {
    if (!hasWarnedNoEventLogger) {
      hasWarnedNoEventLogger = true
      logForDebugging(`[3P telemetry] Event dropped: ${eventName}`, { level: 'warn' })
    }
    return
  }

  if (process.env.NODE_ENV === 'test') return  // Skip in test

  const attributes: Attributes = {
    ...getTelemetryAttributes(),
    'event.name': eventName,
    'event.timestamp': new Date().toISOString(),
    'event.sequence': eventSequence++,
  }

  // Add prompt ID (NOT for metrics - unbounded cardinality)
  const promptId = getPromptId()
  if (promptId) {
    attributes['prompt.id'] = promptId
  }

  // Workspace directory from desktop app (events only)
  const workspaceDir = process.env.CLAUDE_CODE_WORKSPACE_HOST_PATHS
  if (workspaceDir) {
    attributes['workspace.host_paths'] = workspaceDir.split('|')
  }

  // Add metadata as attributes
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      attributes[key] = value
    }
  }

  eventLogger.emit({
    body: `claude_code.${eventName}`,
    attributes,
  })
}
```

## Key Concepts
1. **Event Sequence**: Monotonically increasing counter for ordering within session
2. **Prompt ID Correlation**: Link events to specific prompts (NOT for metrics)
3. **Workspace Paths**: Desktop app host paths (split by |)
4. **Redaction**: OTEL_LOG_USER_PROMPTS env var controls content visibility
5. **One-Time Warning**: hasWarnedNoEventLogger prevents spam
6. **Test Skip**: NODE_ENV='test' disables logging

## Benefits
- Ordered event correlation across async operations
- Prompt ID linking for trace analysis
- Content redaction for privacy

## When to Use
- OTel event emission
- Session event correlation
- Privacy-aware logging

## Related Patterns
- OTel Instrumentation Bootstrap (instrumentation.ts)
- Telemetry Attributes (telemetryAttributes.ts)
- Diag Logger (logger.ts)