---
name: task-update-tool-directory
description: "| Use when [task update tool directory] is needed."
  Task Update tool directory.
  
  Features:
  - taskId: Task to update
  - subject, description, activeForm: Update fields
  - status: TaskStatus | 'deleted'
  - addBlocks, removeBlocks: Dependency management
  - owner: Assign to agent
  
  Hooks:
  - executeTaskCompletedHooks
  
  Keywords:
  - Directory reference - Task Update Tool
metadata:
  openclaw:
    emoji: "📋"
    source: claude-code-tools
    triggers: [task-update-tool-reference]
    priority: P1
---

# Task Update Tool Directory

Task Update工具目录。

---

来源: Claude Code tools/TaskUpdateTool/