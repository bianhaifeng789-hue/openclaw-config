---
name: session-memory-update-service
description: "| Use when [session memory update service] is needed."
  Session memory update service.
  
  Features:
  - Forked subagent for background extraction
  - PostSamplingHook registration
  - Cache sharing with parent agent
  - Sequential processing
  - FileEditTool only tool allowed
  
  Functions:
  - initSessionMemory()
  - updateSessionMemory()
  - loadSessionMemoryTemplate()
  - buildSessionMemoryUpdatePrompt()
  
  Keywords:
  - Service reference - session memory update
metadata:
  openclaw:
    emoji: "📝"
    source: claude-code-services
    triggers: [session-memory-update]
    priority: P2
---

# Session Memory Update Service

Session memory update服务。

---

来源: Claude Code services/SessionMemory/sessionMemory.ts