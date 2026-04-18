---
name: view-image-inject
description: "Middleware for injecting image details into conversation before LLM call. When view_image tools have completed, automatically injects a HumanMessage with base64 image data so the LLM can "see" and analyze the images without explicit user prompts. Use when [view image inject] is needed."
---

# View Image Inject Skill

## Overview

When `view_image` tool completes:
- **Check if all tool calls completed** - Verify ToolMessages exist
- **Inject HumanMessage** - With image details + base64 data
- **LLM can "see" images** - Without explicit user request

## Trigger Conditions

1. Last AIMessage contains `view_image` tool calls
2. All tool calls have corresponding ToolMessages
3. No existing image details message

## Message Format

```javascript
HumanMessage({
  content: [
    {type: "text", text: "Here are the images you've viewed:"},
    {type: "text", text: "\n- **image.png** (image/png)"},
    {type: "image_url", image_url: {
      url: "data:image/png;base64,iVBORw0KGgo..."
    }}
  ]
})
```

## State Schema

```javascript
{
  viewed_images: {
    "image.png": {
      mime_type: "image/png",
      base64: "iVBORw0KGgo..."
    }
  }
}
```

## Integration Points

1. **before_model** - Inject before LLM call
2. **Check completion** - All view_image tools done
3. **Create mixed content** - Text + image_url blocks

## Benefits

| Before | After |
|--------|-------|
| User must ask "describe image" | LLM automatically sees images |
| Extra turn for analysis | Immediate analysis in same turn |
| Context wasted on prompt | Efficient image injection |

## Implementation Script

See `impl/bin/view-image-injector.js` for Node.js implementation.

## OpenClaw Integration

Integrates with:
- Vision-capable models (supports_vision)
- Tool execution tracking
- Multimodal context management

## Status

- ✅ Skill documentation created
- 🔜 Implementation script pending