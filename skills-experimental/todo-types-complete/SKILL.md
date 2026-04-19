---
name: todo-types-complete
description: "| Use when [todo types complete] is needed."
  Todo types complete.
  
  TodoStatusSchema:
  - pending
  - in_progress
  - completed
  
  TodoItemSchema:
  - content (string, min 1)
  - status (TodoStatus)
  - activeForm (string, min 1)
  
  Keywords:
  - Type reference - todo complete
metadata:
  openclaw:
    emoji: "📋"
    source: claude-code-utils
    triggers: [todo-types-reference]
    priority: P1
---

# Todo Types Complete

完整Todo类型。

---

来源: Claude Code utils/todo/types.ts