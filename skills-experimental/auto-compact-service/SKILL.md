---
name: auto-compact-service
description: "| Use when context pressure high, needs compaction, or approaching token limits."
  Auto compact service.
  
  Constants:
  - MAX_OUTPUT_TOKENS_FOR_SUMMARY: 20_000
  
  Functions:
  - getEffectiveContextWindowSize(model): Context window minus max output
  
  Features:
  - CLAUDE_CODE_AUTO_COMPACT_WINDOW override
  - Session memory compaction
  - Post compact cleanup
  
  Keywords:
  - Service reference - auto compact
metadata:
  openclaw:
    emoji: "🗜️"
    source: claude-code-services
    triggers: [auto-compact-service]
    priority: P2
---

# Auto Compact Service

Auto compact服务。

---

来源: Claude Code services/compact/autoCompact.ts