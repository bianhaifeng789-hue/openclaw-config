---
name: settings-system
description: "Settings cascade with 5 sources (user/project/local/flag/policy). getSettingsForSource/loadSettingsFromDisk/getInitialSettings. Settings merge with mergeWith(). Drop-in files (managed-settings.d/*.json). Use when [settings system] is needed."
metadata:
  openclaw:
    emoji: "⚙️"
    triggers: [settings-load, settings-change]
    feishuCard: true
---

# Settings System Skill - Settings 系统

Settings cascade 系统，支持 5 种 sources。

## 为什么需要这个？

**场景**：
- Settings cascade management
- Settings loading from disk
- Settings merge
- Drop-in files support
- Managed settings

**Claude Code 方案**：settings.ts + 1016+ lines
**OpenClaw 飞书适配**：Settings cascade + Drop-in files

---

## Settings Sources（5 种）

```typescript
const SETTING_SOURCES = [
  'userSettings',     // User settings (global)
  'projectSettings',  // Project settings (shared)
  'localSettings',    // Local settings (gitignored)
  'flagSettings',     // Flag settings (CLI)
  'policySettings',   // Policy settings (managed)
] as const

type SettingSource = typeof SETTING_SOURCES[number]
```

---

## Settings File Paths

| Source | Path |
|--------|------|
| userSettings | ~/.claude/settings.json |
| projectSettings | .claude/settings.json |
| localSettings | .claude/settings.local.json |
| flagSettings | --settings flag |
| policySettings | managed-settings.json |

---

## Settings Cascade

```typescript
// Cascade order (later overrides earlier)
1. userSettings     // Global user settings
2. projectSettings  // Shared project settings
3. localSettings    // Gitignored local settings
4. flagSettings     // CLI flag settings
5. policySettings   // Managed policy settings
```

---

## Drop-in Files

```typescript
// managed-settings.d/*.json
// Alphabetically sorted, later files win
// systemd/sudoers convention

const dropInDir = getManagedSettingsDropInDir()
// macOS: /Library/Application Support/ClaudeCode/managed-settings.d
// Windows: C:\Program Files\ClaudeCode\managed-settings.d
// Linux: /etc/claude-code/managed-settings.d
```

---

## Functions

### 1. Get Settings For Source

```typescript
function getSettingsForSource(source: SettingSource): SettingsJson | null {
  // Check cache first
  const cached = getCachedSettingsForSource(source)
  if (cached !== undefined) return cached
  
  // Load from disk
  const filePath = getSettingsFilePathForSource(source)
  if (!filePath) return null
  
  const { settings, errors } = parseSettingsFile(filePath)
  setCachedSettingsForSource(source, settings)
  return settings
}
```

### 2. Load Settings From Disk

```typescript
function loadSettingsFromDisk(): SettingsWithErrors {
  let merged: SettingsJson = {}
  const errors: ValidationError[] = []
  
  // Load from all sources in cascade order
  for (const source of SETTING_SOURCES) {
    const { settings, sourceErrors } = loadFromSource(source)
    errors.push(...sourceErrors)
    if (settings) {
      merged = mergeWith(merged, settings, settingsMergeCustomizer)
    }
  }
  
  return { settings: merged, errors }
}
```

### 3. Get Initial Settings

```typescript
function getInitialSettings(): SettingsJson {
  // Check session cache
  if (sessionSettingsCache) return sessionSettingsCache.settings
  
  // Load from disk
  const result = loadSettingsFromDisk()
  setSessionSettingsCache(result)
  return result.settings
}
```

---

## 飞书卡片格式

### Settings System 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚙️ Settings System**\n\n---\n\n**Settings Sources（5 种）**：\n\n| Source | Path |\n|--------|------|\n| userSettings | ~/.claude/settings.json |\n| projectSettings | .claude/settings.json |\n| localSettings | .claude/settings.local.json |\n| flagSettings | --settings flag |\n| policySettings | managed-settings.json |\n\n---\n\n**Settings Cascade**：\n```\nuser → project → local → flag → policy\n```\n\n---\n\n**Drop-in Files**：\n• managed-settings.d/*.json\n• Alphabetically sorted\n• systemd/sudoers convention\n• Later files win"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/settings-system-state.json
{
  "sources": ["userSettings", "projectSettings", "localSettings", "flagSettings", "policySettings"],
  "cascadeOrder": "user→project→local→flag→policy",
  "dropIn": {
    "dir": "managed-settings.d",
    "convention": "systemd/sudoers"
  },
  "stats": {
    "totalSettings": 0,
    "loadedSettings": 0
  },
  "lastUpdate": "2026-04-12T01:20:00Z",
  "notes": "Settings System Skill 创建完成。等待 settings load 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| settings.ts (1016+ lines) | Skill + Settings |
| SETTING_SOURCES (5) | 5 sources |
| loadSettingsFromDisk() | Load from disk |
| mergeWith() | Merge settings |
| Drop-in files | Drop-in convention |

---

## 注意事项

1. **5 sources**：全面的 settings sources
2. **Cascade order**：Later overrides earlier
3. **Drop-in files**：systemd/sudoers convention
4. **mergeWith()**：Custom merge logic
5. **Managed settings**：Enterprise policy

---

## 自动启用

此 Skill 在 settings load 时自动运行。

---

## 下一步增强

- 飞书 settings 集成
- Settings analytics
- Settings debugging