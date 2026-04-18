---
name: llm-error-handling
description: "LLM error handling middleware with retry/backoff and user-facing fallbacks. Automatically retries transient errors (408, 429, 500, 502, 503, 504) with exponential backoff, and surfaces graceful error messages for quota/auth failures. Use when [llm error handling] is needed."
---

# LLM Error Handling Skill

## Overview

This skill provides automatic error handling for LLM API calls:
- **Retry transient errors** with exponential backoff
- **Classify errors** into retriable vs non-retriable
- **User-friendly messages** for quota/auth failures

## Error Classification

### Retriable Errors (Auto Retry)
| Pattern | Status Codes |
|---------|-------------|
| Server busy | 408, 425, 429, 500, 502, 503, 504 |
| Rate limit | "rate limit", "try again later" |
| Overloaded | "server busy", "high demand" |
| Transient | APITimeoutError, APIConnectionError |

### Non-Retriable Errors (Immediate Fail)
| Pattern | User Message |
|---------|-------------|
| Quota | "Account out of quota/billing unavailable" |
| Auth | "Authentication invalid, check credentials" |

## Retry Strategy

```javascript
const config = {
  retry_max_attempts: 3,
  retry_base_delay_ms: 1000,
  retry_cap_delay_ms: 8000
};

// Exponential backoff: 1s, 2s, 4s (capped at 8s)
const delay = Math.min(base * 2^(attempt-1), cap);

// Retry-After header support
if (headers['retry-after-ms']) {
  delay = parseInt(headers['retry-after-ms']);
}
```

## Integration Points

1. **wrap_model_call** - Intercept before LLM call
2. **Stream retry events** - Notify user of retry progress
3. **Fallback message** - Return AIMessage with error info

## Error Patterns (Chinese + English)

```javascript
const BUSY_PATTERNS = [
  "server busy", "temporarily unavailable", "try again later",
  "rate limit", "overloaded", "high demand",
  "负载较高", "服务繁忙", "稍后重试", "请稍后重试"
];

const QUOTA_PATTERNS = [
  "insufficient_quota", "quota", "billing", "credit",
  "余额不足", "超出限额", "额度不足", "欠费"
];

const AUTH_PATTERNS = [
  "authentication", "unauthorized", "invalid api key",
  "permission", "forbidden", "access denied",
  "无权", "未授权"
];
```

## Implementation Script

See `impl/bin/llm-error-handler.js` for Node.js implementation.

## OpenClaw Integration

This skill can be integrated into:
- Tool call wrapper layer
- Heartbeat error monitoring
- Session error recovery

## Status

- ✅ Skill documentation created
- 🔜 Implementation script pending