---
name: session-startup-hook
description: "Hook for session startup to auto-generate title, inject context, and initialize state. Runs at session creation to enhance user experience. Use when [session startup hook] is needed."
---

# Session Startup Hook Skill

## Overview

会话启动时的自动化增强：

- **标题生成** - 根据首次对话内容生成标题
- **上下文注入** - 加载用户配置和历史
- **状态初始化** - 创建 session state 文件

## Hook Configuration

```json
{
  "event": "PostModelUse",
  "matcher": {
    "firstExchange": true
  },
  "command": "node impl/bin/title-generator.js run",
  "timeout": 10000
}
```

## Trigger Conditions

```javascript
// First exchange complete
const messages = state.messages || [];
const userCount = messages.filter(m => m.type === 'human').length;
const assistantCount = messages.filter(m => m.type === 'ai').length;

return userCount === 1 && assistantCount >= 1 && !state.title;
```

## State Schema

```json
// state/session-titles.json
{
  "sessions": {
    "session-123": {
      "title": "DeerFlow 功能移植",
      "generatedAt": "2026-04-15T11:10:00Z",
      "method": "llm",  // or "fallback"
      "firstUserMsg": "移植 DeerFlow..."
    }
  }
}
```

## Integration Points

1. **after_model** - After first LLM response
2. **Async generation** - Don't block user
3. **Fallback** - Truncate user message if LLM fails

## Implementation

See `impl/bin/title-generator.js` for generation logic.

## OpenClaw Integration

- Heartbeat task `title-generation-check` monitors pending titles
- Hook `PostModelUse` triggers generation
- State stored in `state/session-titles.json`

## Status

- ✅ Skill documentation created
- ✅ Implementation script exists
- 🔜 Hook integration pending