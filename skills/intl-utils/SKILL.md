# Intl Utils Skill

**优先级**: P29
**来源**: Claude Code `intl.ts`
**适用场景**: Intl对象缓存、Unicode处理

---

## 概述

Intl Utils缓存Intl构造器实例，避免重复创建。提供grapheme/word segmenter用于Unicode文本处理。RelativeTimeFormat缓存用于相对时间显示。

---

## 核心功能

### 1. Segmenter缓存

```typescript
let graphemeSegmenter: Intl.Segmenter | null = null
let wordSegmenter: Intl.Segmenter | null = null

export function getGraphemeSegmenter(): Intl.Segmenter {
  if (!graphemeSegmenter) {
    graphemeSegmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme'
    })
  }
  return graphemeSegmenter
}

export function getWordSegmenter(): Intl.Segmenter {
  if (!wordSegmenter) {
    wordSegmenter = new Intl.Segmenter(undefined, {
      granularity: 'word'
    })
  }
  return wordSegmenter
}
```

### 2. Grapheme提取

```typescript
export function firstGrapheme(text: string): string {
  if (!text) return ''
  const segments = getGraphemeSegmenter().segment(text)
  const first = segments[Symbol.iterator]().next().value
  return first?.segment ?? ''
}

export function lastGrapheme(text: string): string {
  if (!text) return ''
  let last = ''
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    last = segment
  }
  return last
}
```

### 3. RelativeTimeFormat缓存

```typescript
const rtfCache = new Map<string, Intl.RelativeTimeFormat>()

export function getRelativeTimeFormat(
  style: 'long' | 'short' | 'narrow',
  numeric: 'always' | 'auto'
): Intl.RelativeTimeFormat {
  const key = `${style}:${numeric}`
  let rtf = rtfCache.get(key)
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat('en', { style, numeric })
    rtfCache.set(key, rtf)
  }
  return rtf
}
```

---

## OpenClaw应用

### 1. 飞书时间显示

```typescript
// 相对时间显示
const rtf = getRelativeTimeFormat('short', 'auto')
const diffMs = messageTime - now
const diffSec = Math.trunc(diffMs / 1000)
const relativeTime = rtf.format(diffSec, 'second')
// 输出: "5s ago", "in 3s"
```

### 2. Unicode文本处理

```typescript
// 飞书消息首字提取（emoji等）
const firstChar = firstGrapheme(message)
// 输入: "👍好的" → 输出: "👍"

// 最后字符
const lastChar = lastGrapheme(message)
```

---

## 状态文件

```json
{
  "skill": "intl-utils",
  "priority": "P29",
  "source": "intl.ts",
  "enabled": true,
  "segmenters": ["grapheme", "word"],
  "rtfCacheSize": 0,
  "timezone": null,
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `intl.ts`