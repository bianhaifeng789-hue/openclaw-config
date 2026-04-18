---
name: tool-error-handling
description: "Convert tool exceptions into error ToolMessages so the run can continue. Prevents tool failures from crashing the agent loop by returning structured error messages with guidance for alternative approaches. Use when [tool error handling] is needed."
---

# Tool Error Handling Skill

## Overview

When a tool execution fails:
- **Don't crash** the agent loop
- **Return error ToolMessage** with structured info
- **Guide the agent** to use alternatives

## Error Message Format

```javascript
ToolMessage({
  content: `Error: Tool '${tool_name}' failed with ${error_class}: ${detail}.
            Continue with available context, or choose an alternative tool.`,
  tool_call_id: tool_call_id,
  name: tool_name,
  status: "error"
})
```

## Error Detail Truncation

- Max 500 characters
- Truncate with "..." if longer

```javascript
const detail = error.message.slice(0, 497) + "...";
```

## Integration Points

1. **wrap_tool_call** - Intercept tool execution
2. **Catch exceptions** - Convert to ToolMessage
3. **Preserve GraphBubbleUp** - Don't catch LangGraph control signals

## Benefits

| Before | After |
|--------|-------|
| Tool crash → Agent loop fails | Tool error → Agent continues |
| No guidance | "Try alternative tool" |
| User confusion | Clear error message |

## Implementation Script

See `impl/bin/tool-error-handler.js` for Node.js implementation.

## OpenClaw Integration

Integrates with:
- Tool execution wrapper
- Error telemetry
- Agent resilience layer

## Status

- ✅ Skill documentation created
- 🔜 Implementation script pending