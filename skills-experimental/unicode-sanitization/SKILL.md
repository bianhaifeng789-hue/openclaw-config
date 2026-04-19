---
name: unicode-sanitization
description: "Unicode sanitization for security. partiallySanitizeUnicode + recursivelySanitizeUnicode + NFKC normalization + Dangerous Unicode categories (Cf/Co/Cn) + Hidden character attack mitigation + HackerOne #3086545 + MAX_ITERATIONS=10. Use when [unicode sanitization] is needed."
metadata:
  openclaw:
    emoji: "🛡️"
    triggers: [sanitize, unicode-security]
    feishuCard: true
---

# Unicode Sanitization Skill - Unicode Sanitization

Unicode Sanitization Unicode 安全处理。

## 为什么需要这个？

**场景**：
- Hidden character attack mitigation
- ASCII Smuggling prevention
- Hidden Prompt Injection
- Unicode Tag characters removal
- HackerOne #3086545 reference

**Claude Code 方案**：sanitization.ts + 110+ lines
**OpenClaw 飞书适配**：Unicode sanitization + Security

---

## Security Reference

**HackerOne #3086545**：
- Claude Desktop MCP vulnerability
- Unicode Tag characters hide malicious instructions
- Invisible to users but processed by AI models

**Reference**: https://embracethered.com/blog/posts/2024/hiding-and-finding-text-with-unicode-tags/

---

## Functions

### 1. Partially Sanitize Unicode

```typescript
export function partiallySanitizeUnicode(prompt: string): string {
  let current = prompt
  let previous = ''
  let iterations = 0
  const MAX_ITERATIONS = 10 // Safety limit

  while (current !== previous && iterations < MAX_ITERATIONS) {
    previous = current

    // NFKC normalization
    current = current.normalize('NFKC')

    // Remove dangerous Unicode categories
    // Method 1: Strip Unicode property classes
    current = current.replace(/[\p{Cf}\p{Co}\p{Cn}]/gu, '')

    // Method 2: Explicit ranges (fallback)
    current = current
      .replace(/[\u200B-\u200F]/g, '') // Zero-width spaces, LTR/RTL
      .replace(/[\u202A-\u202E]/g, '') // Directional formatting
      .replace(/[\u2066-\u2069]/g, '') // Directional isolates
      .replace(/[\uFEFF]/g, '') // Byte order mark
      .replace(/[\uE000-\uF8FF]/g, '') // BMP private use

    iterations++
  }

  // Crash if max iterations (deeply nested unicode)
  if (iterations >= MAX_ITERATIONS) {
    throw new Error(`Unicode sanitization reached maximum iterations`)
  }

  return current
}
```

### 2. Recursively Sanitize

```typescript
export function recursivelySanitizeUnicode(value: unknown): unknown {
  if (typeof value === 'string') {
    return partiallySanitizeUnicode(value)
  }

  if (Array.isArray(value)) {
    return value.map(recursivelySanitizeUnicode)
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[recursivelySanitizeUnicode(key)] = recursivelySanitizeUnicode(val)
    }
    return sanitized
  }

  return value
}
```

---

## Dangerous Unicode Categories

| Category | Description |
|----------|-------------|
| **Cf** | Format controls（zero-width, LTR/RTL） |
| **Co** | Private use（U+E000-U+F8FF） |
| **Cn** | Unassigned |
| **Tag chars** | U+E0020-U+E007F（invisible alphabet） |

---

## 飞书卡片格式

### Unicode Sanitization 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🛡️ Unicode Sanitization**\n\n---\n\n**Security**：\n• HackerOne #3086545\n• Hidden character attack\n• ASCII Smuggling\n• Hidden Prompt Injection\n\n---\n\n**Dangerous Categories**：\n• Cf - Format controls\n• Co - Private use\n• Cn - Unassigned\n• Tag chars - Invisible alphabet\n\n---\n\n**Functions**：\n• partiallySanitizeUnicode()\n• recursivelySanitizeUnicode()\n\n---\n\n**MAX_ITERATIONS**：10"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/unicode-sanitization-state.json
{
  "stats": {
    "totalSanitized": 0,
    "maxIterationsHit": 0
  },
  "lastUpdate": "2026-04-12T11:15:00Z",
  "notes": "Unicode Sanitization Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| sanitization.ts (110+ lines) | Skill + Sanitize |
| partiallySanitizeUnicode() | Sanitize |
| NFKC normalization | Normalization |
| HackerOne #3086545 | Security |

---

## 注意事项

1. **MAX_ITERATIONS**：10（prevent infinite loops）
2. **NFKC**：Unicode normalization
3. **Cf/Co/Cn**：Dangerous categories
4. **Tag chars**：U+E0020-U+E007F
5. **Always enabled**：Security requirement

---

## 自动启用

此 Skill 在 message processing 时自动运行。

---

## 下一步增强

- 飞书 sanitize 集成
- Sanitize analytics
- Sanitize debugging