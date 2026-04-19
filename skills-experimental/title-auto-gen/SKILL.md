---
name: title-auto-gen
description: "Middleware for automatic thread title generation. After the first complete exchange (1 user message + 1 assistant response), generates a concise title using LLM or fallback to truncated user message. Use when [title auto gen] is needed."
---

# Title Auto Gen Skill

## Overview

Automatically generate thread title:
- **Trigger**: First complete exchange (user + assistant)
- **Method**: LLM generation or local fallback
- **Result**: Stored in state.title

## Trigger Logic

```javascript
function shouldGenerateTitle(state) {
  // 1. Check config enabled
  if (!config.enabled) return false;

  // 2. Already has title
  if (state.title) return false;

  // 3. First exchange complete
  const messages = state.messages || [];
  const userCount = messages.filter(m => m.type === 'human').length;
  const assistantCount = messages.filter(m => m.type === 'ai').length;

  return userCount === 1 && assistantCount >= 1;
}
```

## Generation Methods

### LLM Generation
```javascript
const prompt = `Generate a concise title (max ${max_words} words) for this conversation:
User: ${user_msg.slice(0, 500)}
Assistant: ${assistant_msg.slice(0, 500)}`;

const title = await model.invoke(prompt);
```

### Local Fallback
```javascript
function fallbackTitle(user_msg) {
  const max_chars = 50;
  if (user_msg.length > max_chars) {
    return user_msg.slice(0, max_chars).trim() + "...";
  }
  return user_msg || "New Conversation";
}
```

## Config Schema

```yaml
title:
  enabled: true
  max_words: 5
  max_chars: 50
  prompt_template: "Generate a title..."
  model_name: null  # Use default model
```

## Integration Points

1. **after_model** - Generate after first response
2. **Async generation** - Don't block on LLM call
3. **Fallback gracefully** - Use local title if LLM fails

## Implementation Script

See `impl/bin/title-generator.js` for Node.js implementation.

## OpenClaw Integration

Integrates with:
- Session metadata
- Thread list UI
- Conversation history

## Status

- ✅ Skill documentation created
- 🔜 Implementation script pending