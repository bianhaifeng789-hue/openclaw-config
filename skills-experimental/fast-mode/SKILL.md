---
name: fast-mode
description: "Fast mode system. isFastModeEnabled + getFastModeModel + FAST_MODE_MODEL_DISPLAY + getFastModeUnavailableReason + FastModeDisabledReason + CLAUDE_CODE_DISABLE_FAST_MODE + orgStatus + feature gates. Use when enabling fast mode, reducing thinking, or optimizing simple queries."
metadata:
  openclaw:
    emoji: "⚡"
    triggers: [fast-mode, model-selection]
    feishuCard: true
---

# Fast Mode Skill - Fast Mode

Fast Mode 快速模式系统。

## 为什么需要这个？

**场景**：
- Fast mode enabled check
- Model selection（Opus 4.6）
- Unavailable reason detection
- Org status check
- Feature gates

**Claude Code 方案**：fastMode.ts + 530+ lines
**OpenClaw 飞书适配**：Fast mode + Model selection

---

## Constants

```typescript
export const FAST_MODE_MODEL_DISPLAY = 'Opus 4.6'

export function getFastModeModel(): string {
  return 'opus' + (isOpus1mMergeEnabled() ? '[1m]' : '')
}
```

---

## Types

### FastModeDisabledReason

```typescript
type FastModeDisabledReason =
  | 'free' // Requires paid subscription
  | 'preference' // Disabled by organization
  | 'extra_usage_disabled' // Requires extra usage billing
  | 'network_error' // Network connectivity issues
  | 'unknown' // Unknown reason
```

### AuthType

```typescript
type AuthType = 'oauth' | 'api-key'
```

---

## Functions

### 1. Is Fast Mode Enabled

```typescript
export function isFastModeEnabled(): boolean {
  return !isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_FAST_MODE)
}
```

### 2. Is Fast Mode Available

```typescript
export function isFastModeAvailable(): boolean {
  if (!isFastModeEnabled()) return false
  return getFastModeUnavailableReason() === null
}
```

### 3. Get Unavailable Reason

```typescript
export function getFastModeUnavailableReason(): string | null {
  // Statsig feature gate (priority)
  const statigReason = getFeatureValue_CACHED_MAY_BE_STALE('tengu_penguins_off', null)
  if (statigReason !== null) return statigReason

  // Native binary check (optional)
  if (!isInBundledMode() && getFeatureValue_CACHED_MAY_BE_STALE('tengu_marble_sandcastle', false)) {
    return 'Fast mode requires the native binary'
  }

  // SDK check (non-interactive + third-party auth + not kairos)
  if (getIsNonInteractiveSession() && preferThirdPartyAuthentication() && !getKairosActive()) {
    const flagFastMode = getSettingsForSource('flagSettings')?.fastMode
    if (!flagFastMode) return 'Fast mode is not available in the Agent SDK'
  }

  // Provider check (only 1P)
  if (getAPIProvider() !== 'firstParty') {
    return 'Fast mode is not available on Bedrock, Vertex, or Foundry'
  }

  // Org status check
  if (orgStatus.status === 'disabled') {
    if (orgStatus.reason === 'network_error' || orgStatus.reason === 'unknown') {
      // Network bypass option
      if (isEnvTruthy(process.env.CLAUDE_CODE_SKIP_FAST_MODE_NETWORK_ERRORS)) {
        return null
      }
    }
    const authType = getClaudeAIOAuthTokens() !== null ? 'oauth' : 'api-key'
    return getDisabledReasonMessage(orgStatus.reason, authType)
  }

  return null
}
```

---

## 飞书卡片格式

### Fast Mode 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚡ Fast Mode**\n\n---\n\n**Model**：Opus 4.6\n\n---\n\n**Disabled Reasons**：\n• free - Requires paid subscription\n• preference - Disabled by organization\n• extra_usage_disabled - Requires extra usage\n• network_error - Network issues\n• unknown - Unknown\n\n---\n\n**Checks**：\n• Statsig feature gate\n• Native binary\n• Agent SDK\n• API provider (1P only)\n• Org status\n\n---\n\n**Env**：CLAUDE_CODE_DISABLE_FAST_MODE"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/fast-mode-state.json
{
  "enabled": false,
  "model": null,
  "reason": null,
  "stats": {
    "checks": 0
  },
  "lastUpdate": "2026-04-12T11:14:00Z",
  "notes": "Fast Mode Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| fastMode.ts (530+ lines) | Skill + Fast |
| Opus 4.6 | Model |
| Org status | Org check |
| Feature gates | Statsig |

---

## 注意事项

1. **Feature gates**：Statsig priority
2. **1P only**：Not Bedrock/Vertex/Foundry
3. **Org status**：Network bypass option
4. **SDK check**：Non-interactive + third-party
5. **Model**：Opus 4.6 (opus[1m])

---

## 自动启用

此 Skill 在 fast mode check 时自动运行。

---

## 下一步增强

- 飞书 fast mode 集成
- Fast mode analytics
- Fast mode debugging