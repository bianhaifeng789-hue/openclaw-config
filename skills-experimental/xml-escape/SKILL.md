# XML Escape Skill

**优先级**: P31
**来源**: Claude Code `xml.ts`
**适用场景**: XML/HTML安全编码

---

## 概述

XML Escape提供XML/HTML特殊字符安全编码，用于元素文本内容和属性值。防止XSS和注入攻击。

---

## 核心功能

### 1. 元素文本编码

```typescript
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
```

### 2. 属性值编码

```typescript
export function escapeXmlAttr(s: string): string {
  return escapeXml(s)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
```

---

## OpenClaw应用

### 1. 飞书卡片内容

```typescript
// 安全编码XML内容
const safeContent = escapeXml(userInput)
// "<script>alert('xss')</script>" → "&lt;script&gt;alert('xss')&lt;/script&gt;"
```

---

## 状态文件

```json
{
  "skill": "xml-escape",
  "priority": "P31",
  "source": "xml.ts",
  "enabled": true,
  "escapedChars": ["&", "<", ">", "\"", "'"],
  "createdAt": "2026-04-12T13:50:00Z"
}
```

---

## 参考

- Claude Code: `xml.ts`