---
name: timeout-utils
description: "Bash timeout configuration. getDefaultBashTimeoutMs (2min default) + getMaxBashTimeoutMs (10min max) + BASH_DEFAULT_TIMEOUT_MS/BASH_MAX_TIMEOUT_MS env vars + Validation (max >= default). Use when [timeout utils] is needed."
metadata:
  openclaw:
    emoji: "⏰"
    triggers: [timeout-check, bash-timeout]
    feishuCard: true
---

# Timeout Utils Skill - Timeout Utils

Timeout Utils Bash 超时配置工具。

## 为什么需要这个？

**场景**：
- Bash operation timeout
- Default timeout config
- Max timeout config
- Env var override
- Timeout validation

**Claude Code 方案**：timeouts.ts + 50+ lines
**OpenClaw 飞书适配**：Timeout utils + Bash config

---

## Constants

```typescript
const DEFAULT_TIMEOUT_MS = 120_000  // 2 minutes
const MAX_TIMEOUT_MS = 600_000      // 10 minutes
```

---

## Functions

### 1. Get Default Bash Timeout

```typescript
function getDefaultBashTimeoutMs(env: EnvLike = process.env): number {
  const envValue = env.BASH_DEFAULT_TIMEOUT_MS
  if (envValue) {
    const parsed = parseInt(envValue, 10)
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return DEFAULT_TIMEOUT_MS
}
```

### 2. Get Max Bash Timeout

```typescript
function getMaxBashTimeoutMs(env: EnvLike = process.env): number {
  const envValue = env.BASH_MAX_TIMEOUT_MS
  if (envValue) {
    const parsed = parseInt(envValue, 10)
    if (!isNaN(parsed) && parsed > 0) {
      // Ensure max is at least as large as default
      return Math.max(parsed, getDefaultBashTimeoutMs(env))
    }
  }
  // Always ensure max is at least as large as default
  return Math.max(MAX_TIMEOUT_MS, getDefaultBashTimeoutMs(env))
}
```

---

## Env Variables

| Env Var | Description |
|---------|-------------|
| BASH_DEFAULT_TIMEOUT_MS | Default timeout（2 min） |
| BASH_MAX_TIMEOUT_MS | Max timeout（10 min） |

---

## 飞书卡片格式

### Timeout Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏰ Timeout Utils**\n\n---\n\n**Constants**：\n• DEFAULT_TIMEOUT_MS = 120,000 (2 min)\n• MAX_TIMEOUT_MS = 600,000 (10 min)\n\n---\n\n**Functions**：\n• getDefaultBashTimeoutMs() - Default\n• getMaxBashTimeoutMs() - Max\n\n---\n\n**Env Vars**：\n• BASH_DEFAULT_TIMEOUT_MS\n• BASH_MAX_TIMEOUT_MS"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/timeout-utils-state.json
{
  "defaultTimeoutMs": 120000,
  "maxTimeoutMs": 600000,
  "stats": {
    "totalChecks": 0
  },
  "lastUpdate": "2026-04-12T10:42:00Z",
  "notes": "Timeout Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| timeouts.ts (50+ lines) | Skill + Timeout |
| DEFAULT_TIMEOUT_MS | 2 min |
| MAX_TIMEOUT_MS | 10 min |
| Env var override | BASH_*_TIMEOUT_MS |

---

## 注意事项

1. **Default 2 min**：120_000 ms
2. **Max 10 min**：600_000 ms
3. **Env override**：BASH_*_TIMEOUT_MS
4. **Validation**：Max >= default
5. **EnvLike type**：Record<string, string | undefined>

---

## 自动启用

此 Skill 在 timeout check 时自动运行。

---

## 下一步增强

- 飞书 timeout 集成
- Timeout analytics
- Timeout debugging