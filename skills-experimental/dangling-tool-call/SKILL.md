---
name: dangling-tool-call
description: "Middleware to fix dangling tool calls in message history. Detects AIMessages with tool_calls that lack corresponding ToolMessages (due to interruption/cancellation) and inserts synthetic error ToolMessages to ensure correct message format. Use when [dangling tool call] is needed."
---

# Dangling Tool Call Skill

## Overview

A **dangling tool call** occurs when:
- AIMessage contains `tool_calls`
- No corresponding `ToolMessage` in history
- Causes LLM errors due to incomplete message format

This skill **patches** such gaps by inserting synthetic ToolMessages with error indicators.

## Problem Scenario

```
User: "Generate a report"
AI: tool_calls=[read_file, grep, analyze]  ← interrupted!
User: "Stop, cancel"
[No ToolMessages for the tool calls]

Next LLM call: ERROR - incomplete tool call sequence
```

## Solution

Insert placeholder ToolMessages immediately after dangling AIMessage:

```javascript
ToolMessage({
  content: "[Tool call was interrupted and did not return a result.]",
  tool_call_id: tc_id,
  name: tc.get("name", "unknown"),
  status: "error"
})
```

## Detection Algorithm

```javascript
function detectDangling(messages) {
  // 1. Collect existing ToolMessage IDs
  const existingToolIds = new Set(
    messages.filter(m => m.type === 'tool').map(m => m.tool_call_id)
  );

  // 2. Find AIMessages with missing ToolMessages
  const dangling = messages.filter(m => m.type === 'ai')
    .flatMap(m => m.tool_calls || [])
    .filter(tc => tc.id && !existingToolIds.has(tc.id));

  return dangling;
}
```

## Patching Strategy

- **Insert immediately after** the dangling AIMessage (not append to end)
- **Use wrap_model_call** instead of before_model for correct positioning
- **Log warning** with patch count

## Integration Points

1. **wrap_model_call** - Intercept before LLM call
2. **Build patched messages** - Insert synthetic ToolMessages
3. **Preserve GraphBubbleUp** - Don't catch LangGraph control signals

## Implementation Script

See `impl/bin/dangling-tool-patcher.js` for Node.js implementation.

## OpenClaw Integration

This skill integrates with:
- Message history validation
- Tool call sequence integrity
- Session recovery after interruption

## Status

- ✅ Skill documentation created
- 🔜 Implementation script pending