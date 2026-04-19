---
name: permission-types
description: "Permission type system with 7 modes (default/plan/acceptEdits/bypassPermissions/dontAsk/auto/bubble). PermissionBehavior (allow/deny/ask). PermissionRule/PermissionUpdate. PermissionUpdateDestination. Use when [permission types] is needed."
metadata:
  openclaw:
    emoji: "🔐"
    triggers: [permission-check, permission-update]
    feishuCard: true
---

# Permission Types Skill - Permission 类型系统

Permission 类型系统，支持 7 种 modes。

## 为什么需要这个？

**场景**：
- Permission mode management
- Permission behavior decisions
- Permission rule management
- Permission update operations
- Destination management

**Claude Code 方案**：permissions.ts + 342+ lines
**OpenClaw 飞书适配**：Permission 类型 + 7 modes

---

## Permission Modes（7 种）

```typescript
type PermissionMode =
  | 'default'        // Default mode
  | 'plan'           // Plan mode
  | 'acceptEdits'    // Accept edits
  | 'bypassPermissions' // Bypass permissions
  | 'dontAsk'        // Don't ask
  | 'auto'           // Auto mode（Ant-only）
  | 'bubble'         // Bubble mode（Internal）
```

---

## Permission Behavior

```typescript
type PermissionBehavior =
  | 'allow'  // Allow tool
  | 'deny'   // Deny tool
  | 'ask'    // Ask user
```

---

## Permission Rule

```typescript
interface PermissionRule {
  source: PermissionRuleSource  // Where rule originated
  ruleBehavior: PermissionBehavior
  ruleValue: PermissionRuleValue
}

type PermissionRuleSource =
  | 'userSettings'     // User settings
  | 'projectSettings'  // Project settings
  | 'localSettings'    // Local settings
  | 'flagSettings'     // Flag settings
  | 'policySettings'   // Policy settings
  | 'cliArg'           // CLI argument
  | 'command'          // Command
  | 'session'          // Session
```

---

## Permission Update

```typescript
type PermissionUpdate =
  | { type: 'addRules'; rules: PermissionRuleValue[]; behavior: PermissionBehavior; destination: PermissionUpdateDestination }
  | { type: 'replaceRules'; rules: PermissionRuleValue[]; behavior: PermissionBehavior; destination: PermissionUpdateDestination }
  | { type: 'removeRules'; rules: PermissionRuleValue[]; behavior: PermissionBehavior; destination: PermissionUpdateDestination }
  | { type: 'setMode'; mode: ExternalPermissionMode; destination: PermissionUpdateDestination }
  | { type: 'addDirectories'; directories: string[]; destination: PermissionUpdateDestination }
  | { type: 'removeDirectories'; directories: string[]; destination: PermissionUpdateDestination }

type PermissionUpdateDestination =
  | 'userSettings'     // User settings
  | 'projectSettings'  // Project settings
  | 'localSettings'    // Local settings
  | 'session'          // Session only
  | 'cliArg'           // CLI argument
```

---

## Permission Mode Config

```typescript
interface PermissionModeConfig {
  title: string        // Full title
  shortTitle: string   // Short title
  symbol: string       // Symbol（⏵⏵/PAUSE_ICON）
  color: ModeColorKey  // Color key
  external: ExternalPermissionMode
}

const PERMISSION_MODE_CONFIG = {
  default: { title: 'Default', shortTitle: 'Default', symbol: '', color: 'text', external: 'default' },
  plan: { title: 'Plan Mode', shortTitle: 'Plan', symbol: PAUSE_ICON, color: 'planMode', external: 'plan' },
  acceptEdits: { title: 'Accept edits', shortTitle: 'Accept', symbol: '⏵⏵', color: 'autoAccept', external: 'acceptEdits' },
  bypassPermissions: { title: 'Bypass Permissions', shortTitle: 'Bypass', symbol: '⏵⏵', color: 'error', external: 'bypassPermissions' },
  dontAsk: { title: "Don't Ask", shortTitle: 'DontAsk', symbol: '⏵⏵', color: 'error', external: 'dontAsk' },
  auto: { title: 'Auto mode', shortTitle: 'Auto', symbol: '⏵⏵', color: 'warning', external: 'default' },
}
```

---

## 飞书卡片格式

### Permission Types 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔐 Permission Types**\n\n---\n\n**Permission Modes（7 种）**：\n\n| Mode | Title | Symbol | Color |\n|------|-------|--------|-------|\n| default | Default | | text |\n| plan | Plan Mode | ⏸ | planMode |\n| acceptEdits | Accept edits | ⏵⏵ | autoAccept |\n| bypassPermissions | Bypass | ⏵⏵ | error |\n| dontAsk | Don't Ask | ⏵⏵ | error |\n| auto | Auto mode | ⏵⏵ | warning |\n\n---\n\n**Permission Behavior**：\n• allow（允许）\n• deny（拒绝）\n• ask（询问）\n\n---\n\n**Permission Update Types**：\n• addRules/replaceRules/removeRules\n• setMode\n• addDirectories/removeDirectories"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/permission-types-state.json
{
  "modes": ["default", "plan", "acceptEdits", "bypassPermissions", "dontAsk", "auto", "bubble"],
  "behaviors": ["allow", "deny", "ask"],
  "sources": ["userSettings", "projectSettings", "localSettings", "policySettings", "cliArg", "command", "session"],
  "destinations": ["userSettings", "projectSettings", "localSettings", "session", "cliArg"],
  "currentMode": "default",
  "stats": {
    "totalRules": 0,
    "totalUpdates": 0
  },
  "lastUpdate": "2026-04-12T01:08:00Z",
  "notes": "Permission Types Skill 创建完成。等待 permission check 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| permissions.ts (342+ lines) | Skill + Types |
| PermissionMode (7 modes) | 7 modes |
| PermissionBehavior (3) | 3 behaviors |
| PermissionUpdate (6 types) | 6 update types |
| PermissionModeConfig | Mode config |

---

## 注意事项

1. **7 modes**：全面的 permission modes
2. **3 behaviors**：allow/deny/ask
3. **6 update types**：全面的 update operations
4. **5 destinations**：存储 destinations
5. **7 sources**：规则 sources

---

## 自动启用

此 Skill 在 permission check 时自动运行。

---

## 下一步增强

- 飞书 permission 集成
- Permission analytics
- Mode transitions