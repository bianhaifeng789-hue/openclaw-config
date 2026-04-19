# MCP Output Storage Skill

**优先级**: P30
**来源**: Claude Code `mcpOutputStorage.ts`
**适用场景**: MCP二进制内容持久化、mime type映射

---

## 概述

MCP Output Storage处理MCP大输出存储，将二进制内容写入tool-results目录，提供mime type → extension映射。

---

## 核心功能

### 1. Mime Type → Extension

```typescript
export function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf': return 'pdf'
    case 'application/json': return 'json'
    case 'text/plain': return 'txt'
    case 'text/markdown': return 'md'
    case 'image/png': return 'png'
    case 'image/jpeg': return 'jpg'
    case 'audio/mpeg': return 'mp3'
    case 'video/mp4': return 'mp4'
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'docx'
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'xlsx'
    default: return 'bin'
  }
}
```

### 2. Binary Detection

```typescript
export function isBinaryContentType(contentType: string): boolean {
  if (contentType.startsWith('text/')) return false
  if (contentType.endsWith('+json')) return false
  if (contentType.endsWith('+xml')) return false
  if (contentType === 'application/json') return false
  return true
}
```

### 3. Large Output Instructions

```typescript
export function getLargeOutputInstructions(
  rawOutputPath: string,
  contentLength: number,
  formatDescription: string,
  maxReadLength?: number
): string
```

---

## OpenClaw应用

### 1. 飞书文件处理

```typescript
// 判断文件类型
const ext = extensionForMimeType(file.mimeType)
const isBinary = isBinaryContentType(file.mimeType)

// 大文件处理
const instructions = getLargeOutputInstructions(
  filePath,
  file.size,
  'PDF document'
)
```

---

## 状态文件

```json
{
  "skill": "mcp-output-storage",
  "priority": "P30",
  "source": "mcpOutputStorage.ts",
  "enabled": true,
  "supportedMimeTypes": 20,
  "createdAt": "2026-04-12T13:30:00Z"
}
```

---

## 参考

- Claude Code: `mcpOutputStorage.ts`