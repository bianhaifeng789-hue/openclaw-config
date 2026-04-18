---
name: tool-schema-cache
description: "Session-scoped tool schema cache. Memoize per-session. Avoid byte-level changes from GB gates. Reduce token consumption. Use when [tool schema cache] is needed."
metadata:
  openclaw:
    emoji: "📦"
    triggers: [tool-load, session-start]
    feishuCard: true
---

# Tool Schema Cache Skill - 工具 Schema 缓存

Session 级别 Schema 缓存，减少 token 消耗。

## 为什么需要这个？

**场景**：
- Tool schema 渲染开销
- GrowthBook gate flips
- MCP reconnects
- Dynamic content changes

**Claude Code 方案**：toolSchemaCache.ts + Map
**OpenClaw 飞书适配**：Schema 缓存 + Session 管理

---

## Cache 结构

```typescript
type CachedSchema = BetaTool & {
  strict?: boolean
  eager_input_streaming?: boolean
}

const TOOL_SCHEMA_CACHE = new Map<string, CachedSchema>()
```

---

## Cache 操作

### 1. Get Cache

```typescript
function getToolSchemaCache(): Map<string, CachedSchema> {
  return TOOL_SCHEMA_CACHE
}
```

### 2. Clear Cache

```typescript
function clearToolSchemaCache(): void {
  TOOL_SCHEMA_CACHE.clear()
}
```

---

## 缓存策略

```
Session-scoped cache:
1. First render → memoize schema bytes
2. Mid-session GB refresh → no cache bust
3. MCP reconnect → selective clear
4. Dynamic content → bust affected tools only
```

---

## 飞书卡片格式

### Schema Cache Status 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📦 Tool Schema Cache Status**\n\n---\n\n**缓存信息**：\n\n| 属性 | 值 |\n|------|------|\n| **缓存大小** | 43 entries |\n| **Session ID** | session-abc123 |\n| **Token 节省** | ~11K tokens |\n\n---\n\n**缓存工具**：\n• BashTool ✓\n• FileEditTool ✓\n• FileReadTool ✓\n• WebSearchTool ✓\n• ...（共 43 个）\n\n---\n\n**缓存命中率**：98%"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 渲染 Schema

```
Tool Schema Cache:
1. 检查 cache
2. 如果存在 → 返回 cached
3. 如果不存在 → 渲染并 cache
4. 返回 schema
```

### 2. Cache 管理

```typescript
function getOrCreateSchema(
  tool: Tool,
  sessionId: string
): CachedSchema {
  const key = `${sessionId}:${tool.name}`
  
  // Check cache
  const cached = TOOL_SCHEMA_CACHE.get(key)
  if (cached) {
    return cached
  }
  
  // Render schema
  const schema = renderToolSchema(tool)
  
  // Cache it
  TOOL_SCHEMA_CACHE.set(key, schema)
  
  return schema
}
```

---

## 持久化存储

```json
// memory/tool-schema-cache-state.json
{
  "sessions": [
    {
      "sessionId": "session-1",
      "cachedTools": 43,
      "tokensSaved": 11000,
      "hitRate": 98,
      "timestamp": "2026-04-12T00:00:00Z"
    }
  ],
  "stats": {
    "totalSessions": 0,
    "avgTokensSaved": 0,
    "avgHitRate": 0
  },
  "current": {
    "size": 0,
    "tools": []
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| toolSchemaCache.ts | Skill + Map |
| TOOL_SCHEMA_CACHE | Session scoped |
| clearToolSchemaCache() | Auth change clear |
| BetaTool | Tool schema type |

---

## 注意事项

1. **Session scoped**：每个 session 独立 cache
2. **Key format**：sessionId:toolName
3. **Selective clear**：只 clear affected tools
4. **Token 节省**：约 11K tokens
5. **Hit rate**：监控命中率

---

## 自动启用

此 Skill 在 session start 或 tool load 时自动触发。

---

## 下一步增强

- Cache analytics
- Selective invalidation
- Token saving report