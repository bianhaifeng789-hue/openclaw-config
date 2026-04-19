# OTel Events Skill

**优先级**: P31
**来源**: Claude Code `telemetry/events.ts`
**适用场景**: OpenTelemetry事件日志

---

## 概述

OTel Events实现OpenTelemetry事件日志，用于监控和分析。支持用户prompt脱敏（OTEL_LOG_USER_PROMPTS）。

---

## 核心功能

### 1. 事件日志

```typescript
let eventSequence = 0

export async function logOTelEvent(
  eventName: string,
  metadata: { [key: string]: string | undefined }
): Promise<void> {
  const attributes: Attributes = {
    ...getTelemetryAttributes(),
    'event.name': eventName,
    'event.timestamp': new Date().toISOString(),
    'event.sequence': eventSequence++
  }
  
  eventLogger.emit({
    body: `claude_code.${eventName}`,
    attributes
  })
}
```

### 2. Prompt脱敏

```typescript
export function redactIfDisabled(content: string): string {
  return isUserPromptLoggingEnabled() ? content : '<REDACTED>'
}
```

---

## OpenClaw应用

### 1. 遥测事件

```typescript
// 记录飞书事件
await logOTelEvent('feishu_message_received', {
  'chat.type': chatType,
  'user.id': userId
})
```

---

## 状态文件

```json
{
  "skill": "otel-events",
  "priority": "P31",
  "source": "telemetry/events.ts",
  "enabled": true,
  "eventSequence": true,
  "redaction": true,
  "createdAt": "2026-04-12T13:50:00Z"
}
```

---

## 参考

- Claude Code: `telemetry/events.ts`