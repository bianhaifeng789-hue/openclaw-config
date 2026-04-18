# Tool Search Tool Skill

工具搜索工具 - Memoized description + Cache invalidation + MCP parse + Keyword scoring。

## 功能概述

从Claude Code的ToolSearchTool提取的deferred tool搜索模式，用于OpenClaw的工具发现。

## 核心机制

### Memoized Description

```typescript
const getToolDescriptionMemoized = memoize(
  async (toolName: string, tools: Tools): Promise<string> => {
    const tool = findToolByName(tools, toolName)
    return tool.prompt({ getToolPermissionContext: async () => ..., tools, agents: [] })
  },
  (toolName: string) => toolName
)
// Memoize by tool name
// 避免重复调用prompt()
```

### Cache Invalidation

```typescript
function maybeInvalidateCache(deferredTools: Tools): void {
  const currentKey = getDeferredToolsCacheKey(deferredTools)
  if (cachedDeferredToolNames !== currentKey) {
    getToolDescriptionMemoized.cache.clear?.()
    cachedDeferredToolNames = currentKey
  }
}
// deferred tools变化 → clear cache
// 检测工具列表变化
```

### MCP Tool Name Parse

```typescript
function parseToolName(name: string): { parts: string[], full: string, isMcp: boolean } {
  if (name.startsWith('mcp__')) {
    const withoutPrefix = name.replace(/^mcp__/, '').toLowerCase()
    const parts = withoutPrefix.split('__').flatMap(p => p.split('_'))
    return { parts, full: withoutPrefix.replace(/__/g, ' '), isMcp: true }
  }
  // Regular tool - split by CamelCase
  const parts = name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase().split(/\s+/)
  return { parts, full: parts.join(' '), isMcp: false }
}
// mcp__server__action → ['server', 'action']
// CamelCase → ['camel', 'case']
```

### Keyword Scoring

```typescript
// Exact part match
if (parsed.parts.includes(term)) {
  score += parsed.isMcp ? 12 : 10  // MCP server names higher weight
}
// Partial part match
if (parsed.parts.some(part => part.includes(term))) {
  score += parsed.isMcp ? 6 : 5
}
// searchHint match
if (hintNormalized && pattern.test(hintNormalized)) {
  score += 4
}
// Description match
if (pattern.test(descNormalized)) {
  score += 2
}
// 多级scoring
// MCP server name权重最高
```

### Select: Prefix

```typescript
const selectMatch = query.match(/^select:(.+)$/i)
if (selectMatch) {
  const requested = selectMatch[1].split(',').map(s => s.trim())
  // Multi-select支持: select:A,B,C
  // 如果tool不在deferred但in full tools → still return (harmless no-op)
}
// select:ToolName → 直接选择
// 跳过keyword search
```

### Exact Match Fast Path

```typescript
const exactMatch =
  deferredTools.find(t => t.name.toLowerCase() === queryLower) ??
  tools.find(t => t.name.toLowerCase() === queryLower)
if (exactMatch) {
  return [exactMatch.name]
}
// Exact match → 直接返回
// 不做scoring
```

### Required Terms (+prefix)

```typescript
const requiredTerms: string[] = []
const optionalTerms: string[] = []
for (const term of queryTerms) {
  if (term.startsWith('+') && term.length > 1) {
    requiredTerms.push(term.slice(1))
  } else {
    optionalTerms.push(term)
  }
}
// +term → required
// 其他 → optional
```

### Pending MCP Servers

```typescript
const pending = appState.mcp.clients.filter(c => c.type === 'pending')
return pending.length > 0 ? pending.map(s => s.name) : undefined
// MCP servers connecting → 返回pending list
// 搜索无结果时提示用户等待
```

### Tool Reference Blocks

```typescript
return {
  type: 'tool_result',
  content: content.matches.map(name => ({
    type: 'tool_reference' as const,
    tool_name: name
  }))
}
// 1P/Foundry支持tool_reference
// 自动expand deferred tools
```

## 实现建议

### OpenClaw适配

1. **memoize**: Description memoize
2. **cacheInvalidation**: Cache invalidation
3. **mcpParse**: MCP name parse
4. **keywordScoring**: Keyword scoring

### 状态文件示例

```json
{
  "query": "slack",
  "matches": ["mcp__slack__send_message"],
  "totalDeferred": 15,
  "pendingServers": ["github"],
  "cacheInvalidated": true
}
```

## 关键模式

### Memoize + Invalidation

```
memoize(toolName) + deferredTools变化检测 → clear cache
// 性能优化
// 保持fresh
```

### MCP Name Parse

```
mcp__server__action → ['server', 'action'] + isMcp=true + higher score
// MCP工具特殊处理
// Server name权重高
```

### Select Fast Path

```
select:ToolName → direct return, no search
select:A,B,C → multi-select
// 跳过搜索
// 精确选择
```

### Required/Optional Terms

```
+term → required (必须匹配)
其他 → optional (加分项)
// 精确控制搜索条件
```

## 借用价值

- ⭐⭐⭐⭐⭐ Memoize + invalidation pattern
- ⭐⭐⭐⭐⭐ MCP name parse + scoring
- ⭐⭐⭐⭐ Keyword scoring tiers
- ⭐⭐⭐⭐ Required/optional terms
- ⭐⭐⭐⭐ Select fast path

## 来源

- Claude Code: `tools/ToolSearchTool/ToolSearchTool.ts` (10KB+)
- 分析报告: P38-27