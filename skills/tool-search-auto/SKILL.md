# Tool Search Auto Skill

**优先级**: P31
**来源**: Claude Code `toolSearch.ts`
**适用场景**: deferred tools自动启用、MCP优化

---

## 概述

Tool Search Auto实现deferred tools自动启用逻辑。当MCP tool descriptions超过context window一定百分比（默认10%），自动启用tool search，延迟加载deferred tools。

---

## 核心功能

### 1. Auto启用阈值

```typescript
const DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE = 10 // 10%

function getAutoToolSearchTokenThreshold(model: string): number {
  const contextWindow = getContextWindowForModel(model, betas)
  const percentage = getAutoToolSearchPercentage() / 100
  return Math.floor(contextWindow * percentage)
}

// env: ENABLE_TOOL_SEARCH=auto:15
function parseAutoPercentage(value: string): number | null {
  if (!value.startsWith('auto:')) return null
  const percent = parseInt(value.slice(5), 10)
  return Math.max(0, Math.min(100, percent)) // Clamp 0-100
}
```

### 2. Deferred Tools Token计数

```typescript
const getDeferredToolTokenCount = memoize(
  async (tools: Tools, model: string): Promise<number | null> => {
    const deferredTools = tools.filter(t => isDeferredTool(t))
    const total = await countToolDefinitionTokens(deferredTools, model)
    return total
  },
  (tools: Tools) => tools.filter(t => isDeferredTool(t)).map(t => t.name)
)
```

### 3. 字符阈值Fallback

```typescript
const CHARS_PER_TOKEN = 2.5

export function getAutoToolSearchCharThreshold(model: string): number {
  return Math.floor(getAutoToolSearchTokenThreshold(model) * CHARS_PER_TOKEN)
}
```

---

## OpenClaw应用

### 1. MCP Tools自动启用

```typescript
// 检测MCP tools token占用
const deferredCount = await getDeferredToolTokenCount(mcpTools, model)
const threshold = getAutoToolSearchTokenThreshold(model)

if (deferredCount && deferredCount > threshold) {
  // 自动启用tool search
  enableToolSearch()
}
```

---

## 状态文件

```json
{
  "skill": "tool-search-auto",
  "priority": "P31",
  "source": "toolSearch.ts",
  "enabled": true,
  "defaultPercentage": 10,
  "envVar": "ENABLE_TOOL_SEARCH",
  "charsPerToken": 2.5,
  "createdAt": "2026-04-12T13:50:00Z"
}
```

---

## 参考

- Claude Code: `toolSearch.ts`