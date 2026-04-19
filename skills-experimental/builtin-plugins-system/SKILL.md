---
name: builtin-plugins-system
description: "| Use when [builtin plugins system] is needed."
  Built-in plugins system.
  
  Features:
  - BUILTIN_PLUGINS Map
  - BUILTIN_MARKETPLACE_NAME = 'builtin'
  - registerBuiltinPlugin()
  - isBuiltinPluginId()
  
  Plugin IDs format:
  - `{name}@builtin` for built-in
  - `{name}@{marketplace}` for marketplace
  
  Differences from bundled skills:
  - Appear in /plugin UI
  - User can enable/disable
  - Can provide multiple components
  
  Keywords:
  - System reference - builtin plugins
metadata:
  openclaw:
    emoji: "🔌"
    source: claude-code-plugins
    triggers: [plugins-reference]
    priority: P2
---

# Builtin Plugins System

内置插件系统。

---

来源: Claude Code plugins/builtinPlugins.ts