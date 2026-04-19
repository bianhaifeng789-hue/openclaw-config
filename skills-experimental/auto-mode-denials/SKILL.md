---
name: auto-mode-denials
description: "Auto mode denials tracking with AutoModeDenial type. recordAutoModeDenial/getAutoModeDenials. MAX_DENIALS=20. RecentDenialsTab in /permissions. Use when [auto mode denials] is needed."
metadata:
  openclaw:
    emoji: "🚫"
    triggers: [auto-mode-denial, recent-denials]
    feishuCard: true
---

# Auto Mode Denials Skill - Auto Mode Denials

Auto Mode Denials tracking，记录 classifier 拒绝的命令。

## 为什么需要这个？

**场景**：
- Track commands denied by auto mode classifier
- Recent denials display
- Permission prompt context
- MAX_DENIALS = 20
- RecentDenialsTab in /permissions

**Claude Code 方案**：autoModeDenials.ts + 35 lines
**OpenClaw 飞书适配**：Denials tracking + Recent display

---

## AutoModeDenial Type

```typescript
type AutoModeDenial = {
  toolName: string      // Tool name（e.g., Bash）
  display: string       // Human-readable description
  reason: string        // Denial reason
  timestamp: number     // Timestamp
}
```

---

## Functions

### 1. Record Auto Mode Denial

```typescript
function recordAutoModeDenial(denial: AutoModeDenial): void {
  if (!feature('TRANSCRIPT_CLASSIFIER')) return
  DENIALS = [denial, ...DENIALS.slice(0, MAX_DENIALS - 1)]
}
```

### 2. Get Auto Mode Denials

```typescript
function getAutoModeDenials(): readonly AutoModeDenial[] {
  return DENIALS
}
```

---

## Constants

```typescript
const MAX_DENIALS = 20  // Max 20 recent denials
```

---

## 飞书卡片格式

### Auto Mode Denials 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🚫 Auto Mode Denials**\n\n---\n\n**Recent Denials（MAX 20）**：\n\n| Tool | Display | Reason | Time |\n|------|---------|--------|------|\n| Bash | npm install | Outside CWD | 01:08 |\n| Bash | rm -rf | Dangerous pattern | 01:05 |\n\n---\n\n**AutoModeDenial Type**：\n```\n{\n  toolName: string,\n  display: string,\n  reason: string,\n  timestamp: number\n}\n```\n\n---\n\n**功能**：\n• Track denied commands\n• Max 20 recent denials\n• RecentDenialsTab in /permissions\n• Permission prompt context"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/auto-mode-denials-state.json
{
  "denials": [],
  "stats": {
    "totalDenials": 0,
    "maxDenials": 20
  },
  "lastUpdate": "2026-04-12T01:08:00Z",
  "notes": "Auto Mode Denials Skill 创建完成。等待 auto mode denial 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| autoModeDenials.ts (35 lines) | Skill + Denials |
| AutoModeDenial type | Denial type |
| recordAutoModeDenial() | Record denial |
| getAutoModeDenials() | Get denials |
| MAX_DENIALS = 20 | Max 20 |

---

## 注意事项

1. **MAX_DENIALS = 20**：最多 20 条
2. **Feature flag**：TRANSCRIPT_CLASSIFIER
3. **RecentDenialsTab**：在 /permissions 显示
4. **readonly array**：不可修改
5. **prepend**：新 denial 加到前面

---

## 自动启用

此 Skill 在 auto mode denial 时自动运行。

---

## 下一步增强

- 飞书 denials 集成
- Denials analytics
- Denials debugging