---
name: deferred-tool-filter
description: "Middleware for deferred tool loading optimization. When enabled, MCP tools are not loaded into context directly but discoverable via tool_search at runtime, reducing context usage and improving tool selection accuracy for large MCP catalogs. Use when [deferred tool filter] is needed."
---

# Deferred Tool Filter Skill

## Overview

**Problem**: Large MCP server catalogs (100+ tools) consume context window.

**Solution**: 
- **List tools by name** in system prompt
- **tool_search tool** for runtime discovery
- **Reduced context** + improved accuracy

## Configuration

```yaml
tool_search:
  enabled: true
  # Tools discoverable via tool_search, not pre-loaded
```

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Context usage | 50K+ tokens | ~2K tokens |
| Tool selection | Often confused | More accurate |
| Discovery | All tools loaded | On-demand search |

## Tool Search Usage

```javascript
// Agent wants to use a tool but doesn't know details
const result = await tool_search({
  query: "database query",
  max_results: 5
});

// Returns matching tools with descriptions
result.tools.forEach(t => {
  console.log(`${t.name}: ${t.description}`);
});
```

## Filter Logic

```javascript
function filterTools(allTools, deferredEnabled) {
  if (!deferredEnabled) return allTools;

  // 1. Core tools always loaded (file, bash, web)
  const core = allTools.filter(t => !t.mcp_server);

  // 2. MCP tools listed in prompt, not loaded
  const mcp = allTools.filter(t => t.mcp_server);
  const mcpNames = mcp.map(t => t.name);

  // 3. Add tool_search to core
  core.push(tool_search_tool);

  return {
    loaded: core,
    discoverable: mcpNames
  };
}
```

## Integration Points

1. **Tool loading** - Filter before agent init
2. **System prompt** - Add discoverable tool names
3. **tool_search tool** - Runtime discovery

## OpenClaw Integration

Integrates with:
- MCP server management
- Context optimization
- Tool registry

## Status

- ✅ Skill documentation created
- 🔜 Implementation pending (config-based)