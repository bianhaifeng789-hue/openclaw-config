---
name: session-memory-services-directory
description: "| Use when [session memory services directory] is needed."
  Session Memory services directory (3 files).
  
  Files:
  - prompts.ts: Session memory update prompts with DEFAULT_SESSION_MEMORY_TEMPLATE
  - sessionMemory.ts: Session memory automatic maintenance
  - sessionMemoryUtils.ts: Utilities
  
  Template Sections:
  - Session Title: 5-10 word descriptive title
  - Current State: Active work, pending tasks
  - Task specification: Design decisions
  - Files and Functions: Important files
  - Workflow: Bash commands
  - Errors & Corrections: Fixes and failed approaches
  - Codebase Documentation: System components
  - Learnings: What worked/not
  - Key results: Specific outputs
  - Worklog: Step summary
  
  Constants:
  - MAX_SECTION_LENGTH: 2000
  - MAX_TOTAL_SESSION_MEMORY_TOKENS: 12000
  
  Keywords:
  - Directory reference - Session Memory
metadata:
  openclaw:
    emoji: "📝"
    source: claude-code-services
    triggers: [session-memory-reference]
    priority: P1
---

# Session Memory Services Directory

Session Memory服务目录（3文件）。

---

来源: Claude Code services/SessionMemory/ (3 files)