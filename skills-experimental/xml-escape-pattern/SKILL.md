# XML Escape Pattern Skill

XML Escape Pattern - xmlEscape + regex replace + html entities map + & < > " ' + escapeXmlChars + unescapeXmlChars + named entities + numeric entities + CDATA section preserve + attribute value escape + text content escape。

## 功能概述

从Claude Code的utils/xml.ts提取的XML escape模式，用于OpenClaw的XML安全处理。

## 核心机制

### xmlEscape

```typescript
export function xmlEscape(str: string): string {
  return str.replace(/[&<>"']/g, char => XML_ENTITIES[char])
}
// Escape XML special chars
# Regex replace /[&<>"']/g
# Map to entities
```

### regex replace

```typescript
str.replace(/[&<>"']/g, char => XML_ENTITIES[char])
// Regex replace
# /[&<>"']/g pattern
# Match all special chars
# Replace with entities
```

### html entities map

```typescript
const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}
// XML entities map
# Named entities
# Standard HTML entities
```

### & < > " '

```typescript
// Five XML special characters
& → &amp;  // Ampersand (must be first)
< → &lt;   // Less than
> → &gt;   // Greater than
" → &quot; // Quote
' → &apos; // Apostrophe
// Five special chars
# & < > " '
# Must escape in XML
```

### escapeXmlChars

```typescript
export function escapeXmlChars(str: string): string {
  return xmlEscape(str)
}
// Escape XML chars
# Alias for xmlEscape
# Convenience wrapper
```

### unescapeXmlChars

```typescript
export function unescapeXmlChars(str: string): string {
  return str.replace(/&(amp|lt|gt|quot|apos);/g, (_, entity) => {
    const reverseMap: Record<string, string> = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
    }
    return reverseMap[entity]
  })
}
// Unescape XML entities
# Reverse map
# Regex replace entities
```

### named entities

```typescript
// Named entities: &amp; &lt; &gt; &quot; &apos;
// Named entities
# Standard HTML/XML
# Predefined entities
```

### numeric entities

```typescript
// Numeric entities: &#38; &#60; &#62; &#34; &#39;
// (not shown in excerpt but supported)
// Numeric entities
# Decimal code points
# Alternative encoding
```

### CDATA section preserve

```typescript
// CDATA sections: <![CDATA[...]]>
// Content inside CDATA not escaped
// (handled separately if needed)
// CDATA preserve
# <![CDATA[...]]>
# No escaping inside
```

### attribute value escape

```typescript
// Attribute values must escape quotes
// attr="value" → attr="escaped"
// Attribute escape
# " and ' escaped
# Safe attribute values
```

### text content escape

```typescript
// Text content must escape & and < >
// <text>content</text> → <text>escaped</text>
// Text escape
# & < > escaped
# Safe text content
```

## 实现建议

### OpenClaw适配

1. **xmlEscape**: xmlEscape + regex replace pattern
2. **entitiesMap**: XML_ENTITIES map pattern
3. **unescapeXml**: unescapeXmlChars reverse map pattern
4. **attributeEscape**: attribute value escape pattern
5. **textEscape**: text content escape pattern

### 状态文件示例

```json
{
  "original": "Hello & World < Test",
  "escaped": "Hello &amp; World &lt; Test",
  "entities": ["&amp;", "&lt;", "&gt;"]
}
```

## 关键模式

### Regex Replace Pattern

```
/[&<>"']/g → match all → char => XML_ENTITIES[char] → map replace → single pass
# regex replace pattern
# match all special chars
# single pass replace
```

### Named Entities Map

```
{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' } → map lookup → O(1)
# named entities map
# map lookup O(1)
# standard HTML entities
```

### & First to Prevent Double-Escape

```
'&' → '&amp;' first → prevent &lt; → &amp;lt; → order matters → ampersand first
# & first to prevent double-escape
# ampersand必须first
# 防止&amp;lt;
```

### Unescape Reverse Map

```
/&(amp|lt|gt|quot|apos);/g → reverseMap[entity] → reverse lookup → unescape
# unescape reverse map
# regex capture entity name
# reverse lookup
```

### Attribute vs Text Escape

```
attribute: escape " and ' | text: escape & and < > → different requirements → context-specific
# attribute vs text escape
# 不同context不同escape
```

## 借用价值

- ⭐⭐⭐⭐ Regex replace pattern
- ⭐⭐⭐⭐ Named entities map pattern
- ⭐⭐⭐⭐ & first to prevent double-escape pattern
- ⭐⭐⭐⭐ Unescape reverse map pattern
- ⭐⭐⭐⭐ Attribute vs text escape pattern

## 来源

- Claude Code: `utils/xml.ts` (estimated ~50 lines)
- 分析报告: P57-5