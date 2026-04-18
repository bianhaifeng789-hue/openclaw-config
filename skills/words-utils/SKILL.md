# Words Utils Skill

**优先级**: P31
**来源**: Claude Code `words.ts`
**适用场景**: 随机单词slug生成、session IDs

---

## 概述

Words Utils生成随机单词slug（adjective + noun + optional digits），用于plan IDs、session names。120+ adjectives、100+ nouns。

---

## 核心功能

### 1. 单词库

```typescript
const ADJECTIVES = [
  'abundant', 'ancient', 'bright', 'calm', 'curious', 'dazzling',
  'elegant', 'fancy', 'gentle', 'happy', 'jolly', 'keen', 'lively',
  'magical', 'noble', 'peaceful', 'radiant', 'serene', 'twinkly',
  'whimsical', 'zesty', // 120+ adjectives
  // Whimsical additions
  'breezy', 'bubbly', 'cosmic', 'dreamy', 'fizzy', 'glimmering',
  'iridescent', 'moonlit', 'shimmering', 'squishy', 'velvety'
]

const NOUNS = [
  'aurora', 'badger', 'blossom', 'breeze', 'cloud', 'dawn',
  'echo', 'fable', 'gaze', 'harmony', 'iris', 'jade',
  'kaleidoscope', 'lullaby', 'meadow', 'nebula', 'oasis',
  'petal', 'quartz', 'rainbow', 'sprout', 'twilight', // 100+ nouns
  // Nature themed
  'acorn', 'amber', 'brook', 'cove', 'dandelion', 'fern'
]
```

### 2. Slug生成

```typescript
export function generateRandomWordSlug(options?: {
  adjective?: boolean   // Default: true
  noun?: boolean        // Default: true
  digits?: boolean | number  // Default: false
}): string {
  const adj = randomElement(ADJECTIVES)
  const noun = randomElement(NOUNS)
  const num = digits ? randomDigits(digits) : ''
  
  // Examples: "curious-aurora", "golden-breeze-42", "whimsical-nebula"
  return `${adj}-${noun}${num ? '-' + num : ''}`
}
```

---

## OpenClaw应用

### 1. Session IDs

```typescript
// 生成友好的session名称
const sessionName = generateRandomWordSlug({ digits: true })
// "magical-sprout-73"

// 飞书对话标题
const title = `Session: ${generateRandomWordSlug()}`
// "Session: curious-dawn"
```

### 2. Plan IDs

```typescript
// 任务计划ID
const planId = generateRandomWordSlug({ adjective: true, noun: true })
// "serene-blossom"
```

---

## 状态文件

```json
{
  "skill": "words-utils",
  "priority": "P31",
  "source": "words.ts",
  "enabled": true,
  "adjectives": 120,
  "nouns": 100,
  "createdAt": "2026-04-12T13:50:00Z"
}
```

---

## 参考

- Claude Code: `words.ts`
- Inspired by: random-word-slugs