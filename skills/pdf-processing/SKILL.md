---
name: pdf-processing
description: "PDF file processing. PDF validation (%PDF- header). Size limits (20MB raw). Base64 encoding. Password protection detection. PDF text extraction. Use when [pdf processing] is needed."
metadata:
  openclaw:
    emoji: "📕"
    triggers: [pdf-read, .pdf]
    feishuCard: true
---

# PDF Processing Skill - PDF 文件处理

处理 PDF 文件，验证和提取内容。

## 为什么需要这个？

**场景**：
- 读取 .pdf 文件
- 验证 PDF 格式
- Size 检查
- Base64 编码
- 文本提取

**Claude Code 方案**：pdf.ts + pdfUtils.ts
**OpenClaw 飞书适配**：PDF 处理 + 验证

---

## PDF 结构

```typescript
type PDFError = {
  reason: 'empty' | 'too_large' | 'password_protected' | 'corrupted' | 'unknown' | 'unavailable'
  message: string
}

type PDFResult<T> =
  | { success: true; data: T }
  | { success: false; error: PDFError }

type PDFData = {
  type: 'pdf'
  file: {
    filePath: string
    base64: string
    originalSize: number
  }
}
```

---

## 处理流程

### 1. Read PDF

```typescript
async function readPDF(filePath: string): PDFResult<PDFData> {
  const fs = getFsImplementation()
  const stats = await fs.stat(filePath)
  const originalSize = stats.size
  
  // Check empty
  if (originalSize === 0) {
    return {
      success: false,
      error: { reason: 'empty', message: 'PDF file is empty' }
    }
  }
  
  // Check size limit (20MB raw)
  if (originalSize > PDF_TARGET_RAW_SIZE) {
    return {
      success: false,
      error: { reason: 'too_large', message: `PDF exceeds ${formatFileSize(PDF_TARGET_RAW_SIZE)}` }
    }
  }
  
  // Read file
  const fileBuffer = await readFile(filePath)
  
  // Validate PDF header
  const header = fileBuffer.subarray(0, 5).toString('ascii')
  if (!header.startsWith('%PDF-')) {
    return {
      success: false,
      error: { reason: 'corrupted', message: 'File is not a valid PDF' }
    }
  }
  
  // Base64 encode
  const base64 = fileBuffer.toString('base64')
  
  return {
    success: true,
    data: {
      type: 'pdf',
      file: { filePath, base64, originalSize }
    }
  }
}
```

### 2. Extract PDF Text

```typescript
async function extractPDFText(filePath: string): PDFResult<{ text: string }> {
  // Use pdftotext or similar tool
  const result = await execFileNoThrow('pdftotext', [filePath, '-'])
  
  if (result.code !== 0) {
    // Check for password protection
    if (result.stderr.includes('password')) {
      return {
        success: false,
        error: { reason: 'password_protected', message: 'PDF is password protected' }
      }
    }
    return {
      success: false,
      error: { reason: 'unknown', message: result.stderr }
    }
  }
  
  return {
    success: true,
    data: { text: result.stdout }
  }
}
```

---

## Size Limits

```typescript
// PDF size limits
const PDF_TARGET_RAW_SIZE = 20 * 1024 * 1024  // 20MB raw
const PDF_MAX_EXTRACT_SIZE = 100 * 1024 * 1024 // 100MB extract

// API limits
// Total request limit: 32MB
// After base64 encoding (~33% larger): 20MB raw max
```

---

## 飞书卡片格式

### PDF Processed 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📕 PDF Processed**\n\n---\n\n**PDF 信息**：\n\n| 属性 | 值 |\n|------|------|\n| **文件** | report.pdf |\n| **大小** | 5.2 MB |\n| **状态** | ✓ Valid |\n| **Header** | %PDF-1.7 |\n\n---\n\n**验证结果**：\n• **PDF Header**：✓ Valid\n• **Size limit**：✓ Under 20MB\n• **Password**：✓ Not protected\n• **Corruption**：✓ Not corrupted\n\n---\n\n**Base64 编码**：已完成\n• **Original size**：5.2 MB\n• **Encoded size**：6.9 MB"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/pdf-processing-state.json
{
  "processedPDFs": [],
  "stats": {
    "totalPDFs": 0,
    "validPDFs": 0,
    "invalidPDFs": 0,
    "totalSize": 0
  },
  "config": {
    "maxRawSize": 20971520,
    "maxExtractSize": 104857600
  },
  "errors": {
    "empty": 0,
    "too_large": 0,
    "password_protected": 0,
    "corrupted": 0,
    "unknown": 0
  },
  "lastUpdate": "2026-04-12T00:18:00Z",
  "notes": "PDF Processing Skill 创建完成。等待 .pdf 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| pdf.ts + pdfUtils.ts | Skill + 处理函数 |
| readPDF() | PDF 读取 |
| extractPDFText() | 文本提取 |
| PDF_TARGET_RAW_SIZE | 20MB |
| %PDF- header | Header 验证 |

---

## 注意事项

1. **Header validation**：%PDF- magic bytes
2. **Size limit**：20MB raw（考虑 base64）
3. **Password detection**：密码保护检查
4. **Base64 encoding**：API 需要 base64
5. **Error types**：多种错误类型

---

## 自动启用

此 Skill 在读取 .pdf 文件时自动触发。

---

## 下一步增强

- 飞书文件上传
- Page limit（100 pages）
- OCR 支持