---
name: todo-context-loss
description: "Middleware that detects when todo list exists in state but write_todos tool call is truncated from message history (context loss due to summarization). Injects a reminder message so the model stays aware of outstanding todos. Use when [todo context loss] is needed."
---

# Todo Context Loss Skill

## Overview

When message history is truncated:
- **write_todos call scrolled out** - Model loses awareness
- **Todo list still exists in state** - Active todos
- **Inject reminder** - HumanMessage with todo status

## Problem Scenario

```
Turn 1: AI calls write_todos([task1, task2, task3])
Turn 2: User: "Continue"
Turn 3: Context window full → summarization
        [write_todos call truncated]

Turn 4: Model doesn't know about todos!
```

## Solution

Inject reminder as HumanMessage:

```xml
<system_reminder>
Your todo list from earlier is no longer visible in the context window,
but it is still active. Here is the current state:

- [pending] Task 1
- [completed] Task 2
- [pending] Task 3

Continue tracking and updating this todo list.
Call `write_todos` whenever status changes.
</system_reminder>
```

## Detection Algorithm

```javascript
function needsReminder(state) {
  const todos = state.todos || [];
  if (todos.length === 0) return false;

  const messages = state.messages || [];

  // 1. write_todos still visible?
  const hasWriteTodos = messages.some(m =>
    m.type === 'ai' && m.tool_calls?.some(tc => tc.name === 'write_todos')
  );
  if (hasWriteTodos) return false;

  // 2. Reminder already injected?
  const hasReminder = messages.some(m =>
    m.type === 'human' && m.name === 'todo_reminder'
  );
  if (hasReminder) return false;

  return true;  // Need to inject
}
```

## Integration Points

1. **before_model** - Check before LLM call
2. **Format todos** - Human-readable status list
3. **HumanMessage injection** - With name="todo_reminder"

## Implementation Script

See `impl/bin/todo-reminder.js` for Node.js implementation.

## OpenClaw Integration

Integrates with:
- Todo state management
- Context window monitoring
- Summarization detection

## Status

- ✅ Skill documentation created
- 🔜 Implementation script pending