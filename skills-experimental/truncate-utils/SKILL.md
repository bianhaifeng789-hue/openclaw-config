---
name: truncate-utils
description: "Width-aware truncation utils. truncatePathMiddle/truncateToWidth/truncateStartToWidth/truncateToWidthNoEllipsis + Grapheme-safe + stringWidth + CJK/emoji support. Use when [truncate utils] is needed."
metadata:
  openclaw:
    emoji: "📏"
    triggers: [truncate-path, truncate-width]
    feishuCard: true
---

# Truncate Utils Skill - Truncate Utils

Truncate Utils 宽度感知截断工具。

## 为什么需要这个？

**场景**：
- Truncate path middle（preserve filename）
- Width-aware truncation
- Grapheme-safe（emoji/CJK）
- Terminal column measurement
- Display formatting

**Claude Code 方案**：truncate.ts + 180+ lines
**OpenClaw 飞书适配**：Truncate utils + Width-aware

---

## Functions

### 1. Truncate Path Middle

```typescript
function truncatePathMiddle(path: string, maxLength: number): string {
  // No truncation needed
  if (stringWidth(path) <= maxLength) return path

  // Find filename (last path segment)
  const lastSlash = path.lastIndexOf('/')
  const filename = lastSlash >= 0 ? path.slice(lastSlash) : path
  const directory = lastSlash >= 0 ? path.slice(0, lastSlash) : ''

  // Calculate space for directory
  const availableForDir = maxLength - 1 - stringWidth(filename)

  // Truncate directory and combine
  const truncatedDir = truncateToWidthNoEllipsis(directory, availableForDir)
  return truncatedDir + '…' + filename
}
```

### 2. Truncate To Width

```typescript
function truncateToWidth(text: string, maxWidth: number): string {
  if (stringWidth(text) <= maxWidth) return text
  if (maxWidth <= 1) return '…'

  let width = 0
  let result = ''

  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    const segWidth = stringWidth(segment)
    if (width + segWidth > maxWidth - 1) break
    result += segment
    width += segWidth
  }

  return result + '…'
}
```

### 3. Truncate Start To Width

```typescript
function truncateStartToWidth(text: string, maxWidth: number): string {
  // Truncate from start, keeping tail
  // Prepends '…' when truncation occurs
}
```

---

## 飞书卡片格式

### Truncate Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📏 Truncate Utils**\n\n---\n\n**Functions**：\n• truncatePathMiddle() - Path truncation\n• truncateToWidth() - Width truncation\n• truncateStartToWidth() - Start truncation\n• truncateToWidthNoEllipsis() - No ellipsis\n\n---\n\n**Features**：\n• Width-aware（stringWidth）\n• Grapheme-safe（emoji/CJK）\n• Terminal columns"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/truncate-utils-state.json
{
  "stats": {
    "totalTruncations": 0,
    "pathTruncations": 0,
    "widthTruncations": 0
  },
  "lastUpdate": "2026-04-12T10:42:00Z",
  "notes": "Truncate Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| truncate.ts (180+ lines) | Skill + Truncate |
| truncatePathMiddle() | Path middle |
| truncateToWidth() | Width-aware |
| Grapheme-safe | Emoji/CJK |

---

## 注意事项

1. **Width-aware**：Terminal columns
2. **Grapheme-safe**：Don't break emoji/CJK
3. **Ellipsis**：'…' marker
4. **Path middle**：Preserve filename
5. **stringWidth**：ink/stringWidth

---

## 自动启用

此 Skill 在 truncate operation 时自动运行。

---

## 下一步增强

- 飞书 truncate 集成
- Truncate analytics
- Truncate debugging