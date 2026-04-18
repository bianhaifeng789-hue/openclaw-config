---
name: plugins-services-directory
description: "| Use when [plugins services directory] is needed."
  Plugins services directory (3 files).
  
  Files:
  - pluginCliCommands.ts: CLI command wrappers
  - PluginInstallationManager.ts: Background installation manager
  - pluginOperations.ts: Core operations
  
  PluginCliCommand:
  - 'install' | 'uninstall' | 'enable' | 'disable' | 'disable-all' | 'update'
  
  ValidScopes:
  - VALID_INSTALLABLE_SCOPES
  - VALID_UPDATE_SCOPES
  
  Keywords:
  - Directory reference - Plugins
metadata:
  openclaw:
    emoji: "🔌"
    source: claude-code-services
    triggers: [plugins-services-reference]
    priority: P1
---

# Plugins Services Directory

Plugins服务目录（3文件）。

---

来源: Claude Code services/plugins/ (3 files)