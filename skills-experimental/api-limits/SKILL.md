---
name: api-limits
description: "API limits constants. Image limits (5MB base64, 2000px). PDF limits (20MB, 100 pages). Media limits (100 per request). Client-side validation. Use when checking rate limits, managing API quotas, or preventing throttling."
metadata:
  openclaw:
    emoji: "📏"
    triggers: [image-upload, pdf-upload, media-check]
    feishuCard: true
---

# API Limits Skill - API 限制常量

API 限制常量，用于 client-side validation。

## 为什么需要这个？

**场景**：
- Image size validation
- PDF size validation
- Media count validation
- Client-side checks
- 避免 API 错误

**Claude Code 方案**：apiLimits.ts + Client validation
**OpenClaw 飞书适配**：API 限制 + Validation

---

## API 限制常量

```typescript
// Image Limits
const API_IMAGE_MAX_BASE64_SIZE = 5 * 1024 * 1024  // 5 MB
const IMAGE_TARGET_RAW_SIZE = (API_IMAGE_MAX_BASE64_SIZE * 3) / 4  // 3.75 MB
const IMAGE_MAX_WIDTH = 2000
const IMAGE_MAX_HEIGHT = 2000

// PDF Limits
const PDF_TARGET_RAW_SIZE = 20 * 1024 * 1024  // 20 MB
const API_PDF_MAX_PAGES = 100
const PDF_EXTRACT_SIZE_THRESHOLD = 3 * 1024 * 1024  // 3 MB
const PDF_MAX_EXTRACT_SIZE = 100 * 1024 * 1024  // 100 MB
const PDF_MAX_PAGES_PER_READ = 20
const PDF_AT_MENTION_INLINE_THRESHOLD = 10

// Media Limits
const API_MAX_MEDIA_PER_REQUEST = 100
```

---

## Validation Functions

### 1. Validate Image

```typescript
function validateImage(file: ImageFile): ValidationResult {
  const stats = getFsImplementation().statSync(file.path)
  
  // Check base64 size
  if (stats.size > IMAGE_TARGET_RAW_SIZE) {
    return {
      valid: false,
      error: `Image exceeds ${formatFileSize(IMAGE_TARGET_RAW_SIZE)} limit`
    }
  }
  
  // Check dimensions
  const dimensions = getImageDimensions(file.path)
  if (dimensions.width > IMAGE_MAX_WIDTH || dimensions.height > IMAGE_MAX_HEIGHT) {
    // Resize needed
    return {
      valid: false,
      needsResize: true,
      maxWidth: IMAGE_MAX_WIDTH,
      maxHeight: IMAGE_MAX_HEIGHT
    }
  }
  
  return { valid: true }
}
```

### 2. Validate PDF

```typescript
function validatePDF(file: PDFFile): ValidationResult {
  const stats = getFsImplementation().statSync(file.path)
  
  // Check size
  if (stats.size > PDF_TARGET_RAW_SIZE) {
    return {
      valid: false,
      error: `PDF exceeds ${formatFileSize(PDF_TARGET_RAW_SIZE)} limit`
    }
  }
  
  // Check pages
  const pageCount = getPDFPageCount(file.path)
  if (pageCount > API_PDF_MAX_PAGES) {
    return {
      valid: false,
      error: `PDF exceeds ${API_PDF_MAX_PAGES} pages limit`
    }
  }
  
  return { valid: true }
}
```

### 3. Validate Media Count

```typescript
function validateMediaCount(images: Image[], pdfs: PDF[]): ValidationResult {
  const totalCount = images.length + pdfs.length
  
  if (totalCount > API_MAX_MEDIA_PER_REQUEST) {
    return {
      valid: false,
      error: `Media count exceeds ${API_MAX_MEDIA_PER_REQUEST} limit`
    }
  }
  
  return { valid: true }
}
```

---

## 飞书卡片格式

### API Limits Validation 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📏 API Limits Validation**\n\n---\n\n**文件验证**：\n\n| 类型 | 限制 | 当前 | 状态 |\n|------|------|------|------|\n| **Image size** | 3.75 MB | 2.5 MB | ✓ |\n| **Image dimensions** | 2000px | 1500px | ✓ |\n| **PDF size** | 20 MB | 5 MB | ✓ |\n| **PDF pages** | 100 | 25 | ✓ |\n| **Media count** | 100 | 10 | ✓ |\n\n---\n\n**验证结果**：✓ All passed\n\n---\n\n**API Limits**：\n• Image base64: 5 MB\n• Image raw: 3.75 MB\n• PDF raw: 20 MB\n• PDF pages: 100\n• Media per request: 100"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/api-limits-state.json
{
  "validations": [],
  "stats": {
    "totalValidations": 0,
    "passed": 0,
    "failed": 0,
    "resized": 0
  },
  "limits": {
    "imageMaxBase64": 5242880,
    "imageTargetRaw": 3932160,
    "imageMaxWidth": 2000,
    "imageMaxHeight": 2000,
    "pdfTargetRaw": 20971520,
    "pdfMaxPages": 100,
    "pdfExtractThreshold": 3145728,
    "mediaMaxPerRequest": 100
  },
  "lastUpdate": "2026-04-12T00:43:00Z",
  "notes": "API Limits Skill 创建完成。等待 media 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| apiLimits.ts | Skill + Constants |
| API_IMAGE_MAX_BASE64_SIZE | 5MB |
| IMAGE_TARGET_RAW_SIZE | 3.75MB |
| PDF_TARGET_RAW_SIZE | 20MB |
| API_MAX_MEDIA_PER_REQUEST | 100 |

---

## 注意事项

1. **Base64 vs Raw**：Base64 比 raw 大 33%
2. **Dimensions**：2000px client-side
3. **Pages**：100 pages API limit
4. **Media count**：100 per request
5. **Client validation**：避免 API 错误

---

## 自动启用

此 Skill 在上传文件时自动验证。

---

## 下一步增强

- 飞书文件验证
- Auto resize
- Error messages optimization