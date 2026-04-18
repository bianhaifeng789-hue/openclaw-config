# Display Tags Stripper Skill

**优先级**: P29
**来源**: Claude Code `displayTags.ts`
**适用场景**: 飞书卡片标题、XML标签剥离

---

## 概述

Display Tags Stripper从文本中剥离XML-like标签块，用于UI标题显示。只匹配小写标签名，大写标签（JSX/HTML）保留。可用于飞书卡片标题显示。

---

## 核心功能

### 1. XML标签剥离

```typescript
// 匹配任何XML-like <tag>...</tag>块
const XML_TAG_BLOCK_PATTERN = /<([a-z][\w-]*)(?:\s[^>]*)?>[\s\S]*?<\/\1>\n?/g

export function stripDisplayTags(text: string): string {
  const result = text.replace(XML_TAG_BLOCK_PATTERN, '').trim()
  return result || text  // 如果剥离后为空，返回原文本
}
```

### 2. Allow Empty版本

```typescript
export function stripDisplayTagsAllowEmpty(text: string): string {
  return text.replace(XML_TAG_BLOCK_PATTERN, '').trim()
}
```

### 3. IDE Context专用

```typescript
const IDE_CONTEXT_TAGS_PATTERN = 
  /<(ide_opened_file|ide_selection)(?:\s[^>]*)?>[\s\S]*?<\/\1>\n?/g

export function stripIdeContextTags(text: string): string {
  return text.replace(IDE_CONTEXT_TAGS_PATTERN, '').trim()
}
```

---

## 实现要点

### 1. 小写标签过滤

```typescript
// 只匹配小写标签名 [a-z][\w-]*
// 大写标签（JSX/HTML）保留：
// - <Button>layout</Button> → 保留
// - <!DOCTYPE html> → 保留
// - <div>content</div> → 剥离（小写）
```

### 2. 非贪婪匹配

```typescript
// 非贪婪body + backreference闭合标签
// 保持相邻块分离
// 未配对尖括号 ("x < y") 不匹配
```

---

## OpenClaw应用

### 1. 飞书卡片标题

```typescript
// 飞书卡片标题显示
const rawTitle = message.content
const displayTitle = stripDisplayTags(rawTitle)

// 示例：
// 输入: "<ide_opened_file>/src/index.ts</ide_opened_file>Fix bug"
// 输出: "Fix bug"

// 飞书卡片标题配置
{
  "header": {
    "title": {
      "tag": "plain_text",
      "content": displayTitle
    }
  }
}
```

### 2. OpenClaw标签

```typescript
// OpenClaw扩展：飞书专用标签
const OPENCLAW_TAGS = [
  'feishu_card',
  'feishu_notification',
  'feishu_progress',
  'ide_opened_file',
  'ide_selection'
]

export function stripOpenClawTags(text: string): string {
  // 剥离飞书专用标签
  return stripDisplayTags(text)
}
```

---

## 状态文件

```json
{
  "skill": "display-tags-stripper",
  "priority": "P29",
  "source": "displayTags.ts",
  "enabled": true,
  "pattern": "<([a-z][\\w-]*)(?:\\s[^>]*)?>[\\s\\S]*?<\\/\\1>\\n?",
  "strippedCount": 0,
  "lastInput": null,
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `displayTags.ts`