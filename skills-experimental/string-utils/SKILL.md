---
name: string-utils
description: "String utils with full-width normalization. escapeRegExp/capitalize/plural/firstLineOf/countCharInString/normalizeFullWidthDigits/normalizeFullWidthSpace/safeJoinLines/EndTruncatingAccumulator/truncateToLines. Use when [string utils] is needed."
metadata:
  openclaw:
    emoji: "📝"
    triggers: [string-normalize, string-escape]
    feishuCard: true
---

# String Utils Skill - String Utils

String Utils 字符串工具。

## 为什么需要这个？

**场景**：
- Escape regex chars
- Capitalize first char
- Plural form
- Full-width normalization（CJK IME）
- Safe string accumulation
- Line truncation

**Claude Code 方案**：stringUtils.ts + 235+ lines
**OpenClaw 飞书适配**：String utils + Full-width normalization

---

## Constants

```typescript
const MAX_STRING_LENGTH = 2 ** 25  // 32MB - prevent RSS blowup
```

---

## Functions

### 1. Escape RegExp

```typescript
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
```

### 2. Capitalize

```typescript
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
```

### 3. Plural

```typescript
function plural(n: number, word: string, pluralWord = word + 's'): string {
  return n === 1 ? word : pluralWord
}
```

### 4. First Line Of

```typescript
function firstLineOf(s: string): string {
  const nl = s.indexOf('\n')
  return nl === -1 ? s : s.slice(0, nl)
}
```

### 5. Normalize Full-Width Digits

```typescript
function normalizeFullWidthDigits(input: string): string {
  return input.replace(/[０-９]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  )
}
```

### 6. Normalize Full-Width Space

```typescript
function normalizeFullWidthSpace(input: string): string {
  return input.replace(/\u3000/g, ' ')
}
```

---

## EndTruncatingAccumulator

```typescript
class EndTruncatingAccumulator {
  private content: string = ''
  private isTruncated = false
  private totalBytesReceived = 0

  constructor(private readonly maxSize: number = MAX_STRING_LENGTH) {}

  append(data: string | Buffer): void {
    // Safe accumulation with truncation
  }

  toString(): string {
    // Return accumulated string with truncation marker
  }

  clear(): void {
    // Clear all data
  }
}
```

---

## 飞书卡片格式

### String Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📝 String Utils**\n\n---\n\n**Functions**：\n• escapeRegExp() - Escape regex\n• capitalize() - Uppercase first\n• plural() - Plural form\n• normalizeFullWidthDigits() - Zenkaku → half\n• normalizeFullWidthSpace() - U+3000 → space\n\n---\n\n**Constants**：\n• MAX_STRING_LENGTH = 32MB"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/string-utils-state.json
{
  "maxStringLength": 33554432,
  "stats": {
    "totalNormalizations": 0,
    "fullWidthNormalized": 0
  },
  "lastUpdate": "2026-04-12T10:32:00Z",
  "notes": "String Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| stringUtils.ts (235+ lines) | Skill + String |
| normalizeFullWidthDigits() | CJK IME |
| EndTruncatingAccumulator | Safe accumulation |
| MAX_STRING_LENGTH | 32MB |

---

## 注意事项

1. **Full-width**：CJK IME support
2. **32MB limit**：Prevent RSS blowup
3. **Safe accumulation**：Truncate from end
4. **Regex escape**：Special chars
5. **Plural form**：Custom plural word

---

## 自动启用

此 Skill 在 string operation 时自动运行。

---

## 下一步增强

- 飞书 string 集成
- String analytics
- String debugging