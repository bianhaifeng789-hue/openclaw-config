---
name: json-utils
description: "JSON utils with LRU cache. safeParseJSON/safeParseJSONC + LRU-bounded 50 entries + PARSE_CACHE_MAX_KEY_BYTES 8KB + JSONL parsing + modifyJsonc preserving comments. Use when [json utils] is needed."
metadata:
  openclaw:
    emoji: "📊"
    triggers: [json-parse, jsonc-parse]
    feishuCard: true
---

# JSON Utils Skill - JSON Utils

JSON Utils LRU 缓存解析。

## 为什么需要这个？

**场景**：
- LRU-bounded JSON parse cache
- JSONC with comments
- JSONL format parsing
- Large input bypass
- Efficient parsing

**Claude Code 方案**：json.ts + 278+ lines
**OpenClaw 飞书适配**：JSON utils + LRU cache

---

## Constants

```typescript
const PARSE_CACHE_MAX_KEY_BYTES = 8 * 1024  // 8KB - skip cache for large
const LRU_CACHE_SIZE = 50  // 50 entries max
```

---

## Functions

### 1. Safe Parse JSON

```typescript
function safeParseJSON(
  json: string | null | undefined,
  shouldLogError: boolean = true,
): unknown {
  if (!json) return null
  
  // Bypass cache for large inputs
  const result = json.length > PARSE_CACHE_MAX_KEY_BYTES
    ? parseJSONUncached(json, shouldLogError)
    : parseJSONCached(json, shouldLogError)
  
  return result.ok ? result.value : null
}
```

### 2. Safe Parse JSONC

```typescript
function safeParseJSONC(json: string | null | undefined): unknown {
  if (!json) return null
  try {
    return parseJsonc(stripBOM(json))  // JSONC with comments
  } catch (e) {
    logError(e)
    return null
  }
}
```

### 3. Parse JSONL

```typescript
function parseJSONL(data: string | Buffer): unknown[] {
  // Bun.JSONL.parseChunk if available
  // Fallback to manual parsing
}
```

---

## Cache Strategy

| Input Size | Strategy |
|------------|----------|
| ≤ 8KB | LRU cache（50 entries） |
| > 8KB | Bypass cache（uncached） |
| null/undefined | Return null |

---

## 飞书卡片格式

### JSON Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📊 JSON Utils**\n\n---\n\n**Constants**：\n• PARSE_CACHE_MAX_KEY_BYTES = 8KB\n• LRU_CACHE_SIZE = 50 entries\n\n---\n\n**Functions**：\n• safeParseJSON() - LRU-bounded cache\n• safeParseJSONC() - JSONC with comments\n• parseJSONL() - JSONL parsing\n\n---\n\n**Cache Strategy**：\n| Size | Strategy |\n|------|----------|\n| ≤8KB | LRU cache |\n| >8KB | Bypass |"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/json-utils-state.json
{
  "cacheSize": 50,
  "maxKeyBytes": 8192,
  "stats": {
    "totalParsed": 0,
    "cachedParsed": 0,
    "bypassedParsed": 0
  },
  "lastUpdate": "2026-04-12T02:00:00Z",
  "notes": "JSON Utils Skill 创建完成。等待 parse 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| json.ts (278+ lines) | Skill + JSON |
| safeParseJSON() | LRU cache |
| PARSE_CACHE_MAX_KEY_BYTES | 8KB |
| LRU cache | 50 entries |

---

## 注意事项

1. **LRU-bounded**：50 entries max
2. **Bypass large**：> 8KB uncached
3. **JSONC support**：Comments allowed
4. **JSONL support**：Line-by-line JSON
5. **BOM stripping**：PowerShell BOM handling

---

## 自动启用

此 Skill 在 JSON parse 时自动运行。

---

## 下一步增强

- 飞书 JSON 集成
- JSON analytics
- JSON debugging