---
name: settings-cache
description: "Settings cache with sessionSettingsCache/perSourceCache/parseFileCache/pluginSettingsBase. Map-based caching. resetSettingsCache. getCachedSettingsForSource/setCachedSettingsForSource. Use when [settings cache] is needed."
metadata:
  openclaw:
    emoji: "📦"
    triggers: [settings-cache, cache-reset]
    feishuCard: true
---

# Settings Cache Skill - Settings Cache

Settings Cache 管理，支持多层缓存。

## 为什么需要这个？

**场景**：
- Settings caching
- Per-source cache
- File parse cache
- Plugin base layer
- Cache reset

**Claude Code 方案**：settingsCache.ts
**OpenClaw 飞书适配**：Settings cache + Cache management

---

## Cache Types

### 1. Session Settings Cache

```typescript
let sessionSettingsCache: SettingsWithErrors | null = null

function getSessionSettingsCache(): SettingsWithErrors | null {
  return sessionSettingsCache
}

function setSessionSettingsCache(value: SettingsWithErrors): void {
  sessionSettingsCache = value
}
```

### 2. Per-Source Cache

```typescript
const perSourceCache = new Map<SettingSource, SettingsJson | null>()

function getCachedSettingsForSource(source: SettingSource): SettingsJson | null | undefined {
  // undefined = cache miss; null = cached "no settings"
  return perSourceCache.has(source) ? perSourceCache.get(source) : undefined
}

function setCachedSettingsForSource(source: SettingSource, value: SettingsJson | null): void {
  perSourceCache.set(source, value)
}
```

### 3. Parse File Cache

```typescript
type ParsedSettings = {
  settings: SettingsJson | null
  errors: ValidationError[]
}
const parseFileCache = new Map<string, ParsedSettings>()

function getCachedParsedFile(path: string): ParsedSettings | undefined {
  return parseFileCache.get(path)
}

function setCachedParsedFile(path: string, value: ParsedSettings): void {
  parseFileCache.set(path, value)
}
```

### 4. Plugin Settings Base

```typescript
let pluginSettingsBase: Record<string, unknown> | undefined

function getPluginSettingsBase(): Record<string, unknown> | undefined {
  return pluginSettingsBase
}

function setPluginSettingsBase(settings: Record<string, unknown> | undefined): void {
  pluginSettingsBase = settings
}

function clearPluginSettingsBase(): void {
  pluginSettingsBase = undefined
}
```

---

## Functions

### 1. Reset Settings Cache

```typescript
function resetSettingsCache(): void {
  sessionSettingsCache = null
  perSourceCache.clear()
  parseFileCache.clear()
}
```

---

## 飞书卡片格式

### Settings Cache 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📦 Settings Cache**\n\n---\n\n**Cache Layers**：\n\n| Cache | Type |\n|-------|------|\n| sessionSettingsCache | SettingsWithErrors |\n| perSourceCache | Map<Source, Settings> |\n| parseFileCache | Map<Path, Parsed> |\n| pluginSettingsBase | Record<string, unknown> |\n\n---\n\n**Cache Functions**：\n• getCachedSettingsForSource()\n• setCachedSettingsForSource()\n• getCachedParsedFile()\n• setCachedParsedFile()\n• resetSettingsCache()\n\n---\n\n**Cache Reset**：\n• sessionSettingsCache = null\n• perSourceCache.clear()\n• parseFileCache.clear()"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/settings-cache-state.json
{
  "caches": ["sessionSettingsCache", "perSourceCache", "parseFileCache", "pluginSettingsBase"],
  "stats": {
    "sessionCacheHits": 0,
    "sourceCacheHits": 0,
    "fileCacheHits": 0
  },
  "lastUpdate": "2026-04-12T01:20:00Z",
  "notes": "Settings Cache Skill 创建完成。等待 cache operation 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| settingsCache.ts | Skill + Cache |
| sessionSettingsCache | Session cache |
| perSourceCache | Per-source cache |
| parseFileCache | File parse cache |
| resetSettingsCache() | Reset all |

---

## 注意事项

1. **3 Map caches**：Session + Source + File
2. **Plugin base**：Plugin settings layer
3. **undefined vs null**：Cache miss vs cached null
4. **resetSettingsCache()**：Reset all caches
5. **Path-keyed**：File path as cache key

---

## 自动启用

此 Skill 在 cache operation 时自动运行。

---

## 下一步增强

- 飞书 cache 集成
- Cache analytics
- Cache debugging