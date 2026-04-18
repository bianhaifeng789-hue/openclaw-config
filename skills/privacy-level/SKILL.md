---
name: privacy-level
description: "Privacy level control for telemetry. PrivacyLevel 3 levels: default/no-telemetry/essential-traffic. isEssentialTrafficOnly/isTelemetryDisabled. CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC/DISABLE_TELEMETRY. Use when [privacy level] is needed."
metadata:
  openclaw:
    emoji: "🔒"
    triggers: [privacy-check, telemetry-toggle]
    feishuCard: true
---

# Privacy Level Skill - Privacy Level

Privacy Level 隐私级别控制。

## 为什么需要这个？

**场景**：
- Privacy level control
- Telemetry suppression
- Essential traffic control
- Network traffic control
- User privacy preferences

**Claude Code 方案**：privacyLevel.ts + 44 lines
**OpenClaw 飞书适配**：Privacy level + Telemetry control

---

## Privacy Levels

```typescript
type PrivacyLevel = 'default' | 'no-telemetry' | 'essential-traffic'

// Levels ordered by restrictiveness:
// default < no-telemetry < essential-traffic
```

---

## Functions

### 1. Get Privacy Level

```typescript
function getPrivacyLevel(): PrivacyLevel {
  if (process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
    return 'essential-traffic'
  }
  if (process.env.DISABLE_TELEMETRY) {
    return 'no-telemetry'
  }
  return 'default'
}
```

### 2. Is Essential Traffic Only

```typescript
function isEssentialTrafficOnly(): boolean {
  return getPrivacyLevel() === 'essential-traffic'
}
```

### 3. Is Telemetry Disabled

```typescript
function isTelemetryDisabled(): boolean {
  return getPrivacyLevel() !== 'default'
}
```

---

## Environment Variables

| Env Var | Level |
|---------|-------|
| CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC | essential-traffic |
| DISABLE_TELEMETRY | no-telemetry |
| (none) | default |

---

## 飞书卡片格式

### Privacy Level 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔒 Privacy Level**\n\n---\n\n**Privacy Levels**：\n\n| Level | Description |\n|-------|-------------|\n| default | Everything enabled |\n| no-telemetry | Analytics/telemetry disabled |\n| essential-traffic | ALL nonessential network traffic disabled |\n\n---\n\n**Env Vars**：\n• CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC → essential-traffic\n• DISABLE_TELEMETRY → no-telemetry\n\n---\n\n**Functions**：\n• getPrivacyLevel()\n• isEssentialTrafficOnly()\n• isTelemetryDisabled()"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/privacy-level-state.json
{
  "currentLevel": "default",
  "envVars": {
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": false,
    "DISABLE_TELEMETRY": false
  },
  "stats": {
    "totalChecks": 0
  },
  "lastUpdate": "2026-04-12T01:54:00Z",
  "notes": "Privacy Level Skill 创建完成。默认级别 default。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| privacyLevel.ts (44 lines) | Skill + Privacy |
| PrivacyLevel (3 levels) | 3 levels |
| isEssentialTrafficOnly() | Essential check |
| isTelemetryDisabled() | Telemetry check |

---

## 注意事项

1. **3 levels**：Ordered by restrictiveness
2. **Env vars**：Two environment variables
3. **Most restrictive**：Wins when multiple set
4. **Essential traffic**：Disables all nonessential
5. **No telemetry**：Disables analytics only

---

## 自动启用

此 Skill 在 privacy check 时自动运行。

---

## 下一步增强

- 飞书 privacy 集成
- Privacy analytics
- Privacy debugging