---
name: todo-write-tool-directory
description: "| Use when [todo write tool directory] is needed."
  Todo Write tool directory.
  
  Features:
  - TodoListSchema: Zod schema for todos
  - verificationNudgeNeeded: Boolean
  
  When to Use:
  - 3+ steps required
  - Complex multi-step tasks
  - User explicitly requests todo list
  - User provides multiple tasks
  
  NOT for:
  - Single trivial task
  - Less than 3 trivial steps
  - Conversational/informational
  
  Rules:
  - Only one in_progress at a time
  - Mark in_progress BEFORE beginning
  
  Keywords:
  - Directory reference - Todo Write Tool
metadata:
  openclaw:
    emoji: "📋"
    source: claude-code-tools
    triggers: [todo-write-tool-reference]
    priority: P1
---

# Todo Write Tool Directory

Todo Write工具目录。

---

来源: Claude Code tools/TodoWriteTool/