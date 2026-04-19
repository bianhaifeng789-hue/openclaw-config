---
name: tool-search-utils
description: "Tool search utilities for deferred tool discovery. DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE=10% + shouldEnableToolSearch + getDeferredToolTokenCount + filterDeferredTools + ENABLE_TOOL_SEARCH env (auto/auto:N/true/false) + Token counting API + Char heuristic + CHARS_PER_TOKEN=2.5. Use when [tool search utils] is needed."
metadata:
  openclaw:
    emoji: "🔍"
    triggers: [tool-search, deferred-tools]
    feishuCard: true
---

# Tool Search Utils Skill - Tool Search Utils

Tool Search Utils 工具搜索工具。

## 为什么需要这个？

**场景**：
- Deferred tool discovery
- Auto-enable threshold
- Token counting
- Tool search optimization
- MCP tool filtering

**Claude Code 方案**：toolSearch.ts + 700+ lines
**OpenClaw 飞书适配**：Tool search + Deferred tools

---

## Constants

```typescript
const DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE = 10 // 10%
const CHARS_PER_TOKEN = 2.5
```

---

## Environment Variable

- `ENABLE_TOOL_SEARCH`:
  - `auto` - Auto-enable at 10%
  - `auto:N` - Auto-enable at N%
  - `true` - Always enable
  - `false` - Always disable

---

## Functions

### 1. Parse Auto Percentage

```typescript
function parseAutoPercentage(value: string): number | null {
  if (!value.startsWith('auto:')) return null

  const percentStr = value.slice(5)
  const percent = parseInt(percentStr, 10)

  if (isNaN(percent)) return null

  // Clamp to 0-100
  return Math.max(0, Math.min(100, percent))
}
```

### 2. Get Threshold

```typescript
function getAutoToolSearchTokenThreshold(model: string): number {
  const betas = getMergedBetas(model)
  const contextWindow = getContextWindowForModel(model, betas)
  const percentage = getAutoToolSearchPercentage() / 100
  return Math.floor(contextWindow * percentage)
}

export function getAutoToolSearchCharThreshold(model: string): number {
  return Math.floor(getAutoToolSearchTokenThreshold(model) * CHARS_PER_TOKEN)
}
```

### 3. Get Deferred Tool Token Count

```typescript
const getDeferredToolTokenCount = memoize(
  async (
    tools: Tools,
    getToolPermissionContext: () => Promise<ToolPermissionContext>,
    agents: AgentDefinition[],
    model: string,
  ): Promise<number | null> => {
    const deferredTools = tools.filter(t => isDeferredTool(t))
    if (deferredTools.length === 0) return 0

    try {
      const total = await countToolDefinitionTokens(
        deferredTools,
        getToolPermissionContext,
        { activeAgents: agents, allAgents: agents },
        model,
      )
      if (total === 0) return null
      return Math.max(0, total - TOOL_TOKEN_COUNT_OVERHEAD)
    } catch {
      return null
    }
  },
  (tools: Tools) => tools.filter(t => isDeferredTool(t)).map(t => t.name),
)
```

### 4. Should Enable Tool Search

```typescript
export async function shouldEnableToolSearch(
  model: string,
  tools: Tools,
  getToolPermissionContext: () => Promise<ToolPermissionContext>,
  agents: AgentDefinition[],
): Promise<boolean> {
  const value = process.env.ENABLE_TOOL_SEARCH
  
  // Explicit true/false
  if (isEnvTruthy(value)) return true
  if (isEnvDefinedFalsy(value)) return false

  // Auto mode
  if (isAutoToolSearchMode(value)) {
    const tokenCount = await getDeferredToolTokenCount(tools, getToolPermissionContext, agents, model)
    
    if (tokenCount !== null) {
      const threshold = getAutoToolSearchTokenThreshold(model)
      return tokenCount > threshold
    }
    
    // Fallback to char heuristic
    const charCount = deferredTools.reduce((sum, t) => sum + estimateToolCharCount(t), 0)
    const charThreshold = getAutoToolSearchCharThreshold(model)
    return charCount > charThreshold
  }

  return false
}
```

---

## 飞书卡片格式

### Tool Search Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔍 Tool Search Utils**\n\n---\n\n**Constants**：\n• DEFAULT_AUTO_TOOL_SEARCH_PERCENTAGE = 10%\n• CHARS_PER_TOKEN = 2.5\n\n---\n\n**Env Var**：\n• ENABLE_TOOL_SEARCH=auto\n• ENABLE_TOOL_SEARCH=auto:N\n• ENABLE_TOOL_SEARCH=true/false\n\n---\n\n**Functions**：\n• shouldEnableToolSearch()\n• getDeferredToolTokenCount()\n• filterDeferredTools()\n\n---\n\n**Threshold**：\n• Token counting API\n• Char heuristic fallback"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/tool-search-utils-state.json
{
  "stats": {
    "autoEnabled": 0,
    "deferredCount": 0
  },
  "lastUpdate": "2026-04-12T12:37:00Z",
  "notes": "Tool Search Utils Skill 创建完成。"
}