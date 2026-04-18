---
name: lsp-services-directory-complete
description: "| Use when [lsp services directory complete] is needed."
  LSP services directory complete (7 files).
  
  Files:
  - config.ts: getAllLspServers from plugins
  - LSPClient.ts: LSP client interface
  - LSPDiagnosticRegistry.ts: Diagnostic registry
  - LSPServerInstance.ts: Server instance
  - LSPServerManager.ts: Server manager
  - manager.ts: LSP manager
  - passiveFeedback.ts: Passive feedback
  
  LSPClient:
  - capabilities, isInitialized
  - start, initialize, sendRequest, sendNotification
  - onNotification, onRequest, stop
  
  Keywords:
  - Directory reference - LSP complete
metadata:
  openclaw:
    emoji: "🔍"
    source: claude-code-services
    triggers: [lsp-services-complete]
    priority: P1
---

# LSP Services Directory Complete

LSP服务目录完整（7文件）。

---

来源: Claude Code services/lsp/ (7 files)