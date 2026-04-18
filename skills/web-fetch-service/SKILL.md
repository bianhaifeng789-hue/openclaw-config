---
name: web-fetch-service
description: "| Use when [web fetch service] is needed."
  Web fetch service.
  
  Features:
  - getURLMarkdownContent
  - applyPromptToMarkdown
  - isPreapprovedUrl, isPreapprovedHost
  - MAX_MARKDOWN_LENGTH
  
  Input:
  - url (URL string)
  - prompt (prompt to run)
  
  Output:
  - bytes, code, codeText, result, durationMs
  
  Keywords:
  - Service reference - web fetch
metadata:
  openclaw:
    emoji: "🌐"
    source: claude-code-tools
    triggers: [web-fetch-service]
    priority: P2
---

# Web Fetch Service

Web fetch服务。

---

来源: Claude Code tools/WebFetchTool/WebFetchTool.ts