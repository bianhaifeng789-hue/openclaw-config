---
name: web-search-service
description: "| Use when [web search service] is needed."
  Web search service.
  
  Features:
  - queryModelWithStreaming: Claude API
  - BetaWebSearchTool20250305 type
  - getMainLoopModel, getSmallFastModel
  
  Input:
  - query (min 2 chars)
  - allowed_domains (optional)
  - blocked_domains (optional)
  
  Output:
  - SearchHit: title, url
  
  Keywords:
  - Service reference - web search
metadata:
  openclaw:
    emoji: "🌐"
    source: claude-code-tools
    triggers: [web-search-service]
    priority: P2
---

# Web Search Service

Web search服务。

---

来源: Claude Code tools/WebSearchTool/WebSearchTool.ts