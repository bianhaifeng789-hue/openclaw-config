---
name: deferred-tool-search
description: |
  Dynamic tool discovery via ToolSearchTool. Defer loading MCP and heavy tools until needed, reducing upfront context token usage.
  
  Use when:
  - Many MCP tools available but rarely all needed
  - Context window is tight and tool definitions take too many tokens
  - Need to discover tools by semantic search at runtime
  
  Keywords: tool search, deferred tools, dynamic tools, MCP tools, tool discovery
metadata:
  openclaw:
    emoji: "🔎"
    source: claude-code-tool-search
    triggers: [tool-discovery, deferred-tools, context-optimization]
    priority: P2
---

# Deferred Tool Search

基于 Claude Code `utils/toolSearch.ts` 的动态工具发现机制，减少上下文 token 占用。

## 核心概念（来自 Claude Code）

### 问题
当有大量 MCP 工具时，把所有工具定义放入 system prompt 会消耗大量 token。

### 解决方案
```
标准模式: 所有工具定义 → system prompt（token 多）

延迟加载模式:
  - 只加载核心工具
  - MCP 工具标记为 defer_loading: true
  - 提供 ToolSearchTool 让模型按需搜索
  - 模型调用 ToolSearchTool("web search") → 返回匹配的工具定义
  - 模型再调用实际工具
```

### ToolSearchMode
```typescript
type ToolSearchMode = 
  | 'standard'   // 所有工具预加载（默认）
  | 'tst'        // 手动启用延迟加载
  | 'tst-auto'   // 自动检测（工具数超阈值时启用）
```

### 自动触发阈值
```typescript
function getAutoToolSearchCharThreshold(model: string): number {
  // 当工具定义总 token 超过阈值时自动启用延迟加载
  // 不同模型有不同阈值
}
```

## OpenClaw 适配实现

### 工具索引构建

```javascript
// 构建工具搜索索引
function buildToolIndex(tools) {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    searchHint: tool.searchHint ?? tool.description.slice(0, 100),
  }))
}
```

### 语义搜索

```javascript
// 根据查询找到最相关的工具
function searchTools(query, toolIndex, limit = 5) {
  const queryLower = query.toLowerCase()
  
  return toolIndex
    .map(tool => ({
      tool,
      score: scoreToolMatch(queryLower, tool)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ tool }) => tool)
}

function scoreToolMatch(query, tool) {
  const text = `${tool.name} ${tool.description} ${tool.searchHint}`.toLowerCase()
  const words = query.split(/\s+/)
  return words.filter(w => text.includes(w)).length
}
```

### 延迟加载格式

```
工具列表（延迟模式）:
  - read_file [deferred] — 读取文件内容
  - bash [deferred] — 执行 shell 命令
  - web_fetch [deferred] — 获取网页内容
  ...

使用 tool_search("读取文件") 来加载具体工具定义
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 触发条件 | 工具 token 超阈值自动启用 | 手动配置 |
| 搜索方式 | 模型调用 ToolSearchTool | 关键词匹配 |
| 工具引用 | tool_reference block | 工具名字符串 |
| 模型支持 | 需要模型支持 tool_reference | 无限制 |
