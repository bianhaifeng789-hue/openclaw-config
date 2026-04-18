---
name: agent-summary-services-directory
description: "| Use when [agent summary services directory] is needed."
  Agent Summary services directory.
  
  Features:
  - Periodic background summarization for coordinator sub-agents
  - Forks conversation every ~30s
  - 1-2 sentence progress summary
  - Stored on AgentProgress for UI
  
  Constants:
  - SUMMARY_INTERVAL_MS: 30_000
  
  Prompt Rules:
  - Present tense (-ing)
  - Name file/function, not branch
  - 3-5 words
  - No tools
  
  Good Examples:
  - "Reading runAgent.ts"
  - "Fixing null check in validate.ts"
  - "Running auth module tests"
  
  Keywords:
  - Directory reference - Agent Summary
metadata:
  openclaw:
    emoji: "🤖"
    source: claude-code-services
    triggers: [agent-summary-reference]
    priority: P1
---

# Agent Summary Services Directory

Agent Summary服务目录。

---

来源: Claude Code services/AgentSummary/