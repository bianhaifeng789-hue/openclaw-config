---
name: deferred-tool-loading
description: "Deferred tool loading configuration for OpenClaw. Reduces context usage by listing MCP tools by name in prompt and making them discoverable via tool_search at runtime. Use when [deferred tool loading] is needed."
---

# Deferred Tool Loading Skill

## Overview

**问题**: MCP 服务器可能有 100+ 工具，全部加载消耗大量上下文。

**方案**:
- **按名称列出** - 系统提示中列出工具名称
- **tool_search** - 运行时按需发现
- **减少上下文** - 提升工具选择准确性

## Configuration

```yaml
# OpenClaw agent config
agents:
  defaults:
    tool_search:
      enabled: true
      max_results: 5
      
    deferred_loading:
      mcp_servers: true  # List MCP tools in prompt, not load
      core_tools: false  # Always load core tools (file, bash, web)
```

## Tool Categories

| Category | Loading Strategy |
|----------|-----------------|
| **Core Tools** | Always loaded (read, write, bash, web) |
| **MCP Tools** | Listed by name, discoverable via tool_search |
| **Skill Tools** | Loaded when skill activates |

## System Prompt Enhancement

```markdown
Available MCP Tools (use tool_search to discover details):
- mcp_github_api
- mcp_slack
- mcp_database
...

Use `tool_search(query="keyword")` to find tool details.
```

## tool_search Tool

```javascript
// Runtime discovery
tool_search({
  query: "database query",
  max_results: 5
})

// Returns
{
  tools: [
    { name: "mcp_database", description: "...", schema: {...} }
  ]
}
```

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Context | 50K+ tokens | ~2K tokens |
| Accuracy | Often confused | More precise |
| Discovery | All loaded | On-demand |

## Implementation

This is a **configuration optimization**, not a new script.

## OpenClaw Config Location

- `~/.openclaw/agents/dispatcher/config.yaml`
- Or workspace `config.yaml`

## Status

- ✅ Skill documentation created
- 🔜 Configuration pending (requires OpenClaw restart)