---
name: context-utils
description: "Context window utilities. MODEL_CONTEXT_WINDOW_DEFAULT (200k) + COMPACT_MAX_OUTPUT_TOKENS (20k) + is1mContextDisabled + has1mContext + modelSupports1M + getContextWindowForModel + calculateContextPercentages + getModelMaxOutputTokens + CAPPED_DEFAULT_MAX_TOKENS (8k) + ESCALATED_MAX_TOKENS (64k). Use when [context utils] is needed."
metadata:
  openclaw:
    emoji: "📐"
    triggers: [context-window, 1m-context]
    feishuCard: true
---

# Context Utils Skill - Context Utils

Context Utils 上下文窗口工具。

## 为什么需要这个？

**场景**：
- 1M context support
- Context window calculation
- Usage percentages
- Max output tokens
- [1m] suffix detection

**Claude Code 方案**：context.ts + 220+ lines
**OpenClaw 飞书适配**：Context utils + Context management

---

## Constants

```typescript
// Model context window size (200k tokens default)
export const MODEL_CONTEXT_WINDOW_DEFAULT = 200_000

// Maximum output tokens for compact operations
export const COMPACT_MAX_OUTPUT_TOKENS = 20_000

// Default max output tokens
const MAX_OUTPUT_TOKENS_DEFAULT = 32_000
const MAX_OUTPUT_TOKENS_UPPER_LIMIT = 64_000

// Capped default for slot-reservation
export const CAPPED_DEFAULT_MAX_TOKENS = 8_000
export const ESCALATED_MAX_TOKENS = 64_000
```

---

## Functions

### 1. 1M Context Check

```typescript
export function is1mContextDisabled(): boolean {
  return isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_1M_CONTEXT)
}

export function has1mContext(model: string): boolean {
  if (is1mContextDisabled()) return false
  return /\[1m\]/i.test(model)
}

export function modelSupports1M(model: string): boolean {
  if (is1mContextDisabled()) return false
  const canonical = getCanonicalName(model)
  return canonical.includes('claude-sonnet-4') || canonical.includes('opus-4-6')
}
```

### 2. Get Context Window

```typescript
export function getContextWindowForModel(
  model: string,
  betas?: string[],
): number {
  // Env override (ant-only)
  if (
    process.env.USER_TYPE === 'ant' &&
    process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS
  ) {
    const override = parseInt(process.env.CLAUDE_CODE_MAX_CONTEXT_TOKENS, 10)
    if (!isNaN(override) && override > 0) return override
  }

  // [1m] suffix
  if (has1mContext(model)) return 1_000_000

  // Model capabilities
  const cap = getModelCapability(model)
  if (cap?.max_input_tokens && cap.max_input_tokens >= 100_000) {
    if (
      cap.max_input_tokens > MODEL_CONTEXT_WINDOW_DEFAULT &&
      is1mContextDisabled()
    ) {
      return MODEL_CONTEXT_WINDOW_DEFAULT
    }
    return cap.max_input_tokens
  }

  // Betas + Coral reef exp
  if (betas?.includes(CONTEXT_1M_BETA_HEADER) && modelSupports1M(model)) {
    return 1_000_000
  }
  if (getSonnet1mExpTreatmentEnabled(model)) return 1_000_000

  // Ant model
  if (process.env.USER_TYPE === 'ant') {
    const antModel = resolveAntModel(model)
    if (antModel?.contextWindow) return antModel.contextWindow
  }

  return MODEL_CONTEXT_WINDOW_DEFAULT
}
```

### 3. Calculate Percentages

```typescript
export function calculateContextPercentages(
  currentUsage: {
    input_tokens: number
    cache_creation_input_tokens: number
    cache_read_input_tokens: number
  } | null,
  contextWindowSize: number,
): { used: number | null; remaining: number | null } {
  if (!currentUsage) return { used: null, remaining: null }

  const totalInputTokens =
    currentUsage.input_tokens +
    currentUsage.cache_creation_input_tokens +
    currentUsage.cache_read_input_tokens

  const usedPercentage = Math.round(
    (totalInputTokens / contextWindowSize) * 100,
  )
  const clampedUsed = Math.min(100, Math.max(0, usedPercentage))

  return {
    used: clampedUsed,
    remaining: 100 - clampedUsed,
  }
}
```

---

## 飞书卡片格式

### Context Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📐 Context Utils**\n\n---\n\n**Constants**：\n• MODEL_CONTEXT_WINDOW_DEFAULT = 200k\n• COMPACT_MAX_OUTPUT_TOKENS = 20k\n• CAPPED_DEFAULT_MAX_TOKENS = 8k\n• ESCALATED_MAX_TOKENS = 64k\n\n---\n\n**Functions**：\n• is1mContextDisabled()\n• has1mContext(model)\n• modelSupports1M(model)\n• getContextWindowForModel()\n• calculateContextPercentages()\n\n---\n\n**1M Context**：\n• [1m] suffix detection\n• Sonnet-4 + Opus-4-6\n• Coral reef experiment"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/context-utils-state.json
{
  "stats": {
    "defaultContextWindow": 200000,
    "1mEnabled": false
  },
  "lastUpdate": "2026-04-12T11:26:00Z",
  "notes": "Context Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| context.ts (220+ lines) | Skill + Context |
| getContextWindowForModel() | Get window |
| 1M context | 1M support |
| calculateContextPercentages() | Percentages |

---

## 注意事项

1. **200k default** - MODEL_CONTEXT_WINDOW_DEFAULT
2. **1M detection** - [1m] suffix + model check
3. **Env override** - CLAUDE_CODE_MAX_CONTEXT_TOKENS (ant-only)
4. **Betas** - CONTEXT_1M_BETA_HEADER
5. **Coral reef** - Sonnet 1m experiment

---

## 自动启用

此 Skill 在 context calculation 时自动运行。

---

## 下一步增强

- 飞书 context 集成
- Context analytics
- Context debugging