---
name: extract-memories-service
description: "| Use when [extract memories service] is needed."
  Extract memories service.
  
  Functions:
  - initExtractMemories()
  - extractMemories()
  - opener(newMessageCount, existingMemories)
  
  Strategy:
  - Turn 1: All FILE_READ calls in parallel
  - Turn 2: All FILE_WRITE/FILE_EDIT calls in parallel
  - No interleaved reads/writes
  
  Keywords:
  - Service reference - extract memories
metadata:
  openclaw:
    emoji: "🧠"
    source: claude-code-services
    triggers: [extract-memories-service]
    priority: P2
---

# Extract Memories Service

Extract memories服务。

---

来源: Claude Code services/extractMemories/extractMemories.ts