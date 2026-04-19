---
name: task-get-tool-directory
description: "| Use when [task get tool directory] is needed."
  Task Get tool directory.
  
  Features:
  - taskId: Task ID to retrieve
  
  Output:
  - task.id, subject, description, status
  - blocks, blockedBy
  
  Status:
  - pending, in_progress, completed
  
  Keywords:
  - Directory reference - Task Get Tool
metadata:
  openclaw:
    emoji: "📋"
    source: claude-code-tools
    triggers: [task-get-tool-reference]
    priority: P1
---

# Task Get Tool Directory

Task Get工具目录。

---

来源: Claude Code tools/TaskGetTool/