---
name: task-create-tool-directory
description: "| Use when [task create tool directory] is needed."
  Task Create tool directory.
  
  Features:
  - subject: Brief title
  - description: What needs to be done
  - activeForm: Spinner text (optional)
  - metadata: Arbitrary metadata
  
  Hooks:
  - executeTaskCreatedHooks
  
  Output:
  - task.id, task.subject
  
  When to Use:
  - 3+ steps required
  - Complex multi-step tasks
  - Plan mode
  - User explicitly requests
  
  NOT for:
  - Single trivial task
  - Less than 3 trivial steps
  - Conversational/informational
  
  Keywords:
  - Directory reference - Task Create Tool
metadata:
  openclaw:
    emoji: "📋"
    source: claude-code-tools
    triggers: [task-create-tool-reference]
    priority: P1
---

# Task Create Tool Directory

Task Create工具目录。

---

来源: Claude Code tools/TaskCreateTool/