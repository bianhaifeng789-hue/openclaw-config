---
name: image-compression
description: "Multi-strategy image compression: progressive resizing, palette optimization, JPEG quality adjustment. Compress to target size while maintaining readability. Use sharp library. Use when [image compression] is needed."
metadata:
  openclaw:
    emoji: "🖼️"
    triggers: [image-upload, token-limit]
    feishuCard: true
---

# Image Compression Skill - 图片压缩

多策略图片压缩，在保持可读性的同时减少 token 使用。

## 为什么需要这个？

**场景**：
- 图片上传时自动压缩
- Token limit 达到时压缩图片
- 减少图片传输大小
- 保持图片可读性

**Claude Code 方案**：imageResizer.ts + multi-strategy
**OpenClaw 飞书适配**：sharp 库 + 飞书图片处理

---

## 压缩策略

### 1. Progressive Resizing

```typescript
// 逐步缩小直到达到目标大小
while (size > targetSize) {
  width = Math.floor(width * 0.75)
  height = Math.floor(height * 0.75)
  image = await resize(image, width, height)
  size = getImageSize(image)
}
```

### 2. Palette Optimization

```typescript
// PNG 优化：减少颜色数量
if (format === 'png') {
  image = await optimizePalette(image, {
    maxColors: 256,  // 减少到 256 色
    dither: true     // 保持视觉效果
  })
}
```

### 3. JPEG Quality Adjustment

```typescript
// JPEG 质量逐步降低
const qualityLevels = [80, 60, 40, 20]
for (const quality of qualityLevels) {
  image = await toJpeg(image, { quality })
  if (getImageSize(image) <= targetSize) break
}
```

---

## Format Detection

```typescript
// Magic bytes 检测
const MAGIC_BYTES = {
  png: [0x89, 0x50, 0x4E, 0x47],
  jpeg: [0xFF, 0xD8, 0xFF],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46]
}

function detectImageFormat(buffer: Buffer): string {
  const header = buffer.slice(0, 4)
  for (const [format, magic] of Object.entries(MAGIC_BYTES)) {
    if (header.equals(Buffer.from(magic))) {
      return format
    }
  }
  return 'unknown'
}
```

---

## 飞书卡片格式

### Compression Report 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🖼️ 图片压缩完成**\n\n**压缩结果**：\n\n| 指标 | 原始 | 压缩后 | 减少 |\n|------|------|--------|------|\n| **大小** | 2.5 MB | 150 KB | 94% |\n| **尺寸** | 2000x1500 | 500x375 | 75% |\n| **格式** | PNG | JPEG | - |\n| **质量** | - | 60 | - |\n\n---\n\n**策略**：Progressive resizing + JPEG quality 60\n\n**Token 减少**：约 800 → 100 tokens\n\n**可读性**：保持良好（文字清晰）"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 检测图片格式

```
Image Compression:
1. 读取图片 buffer
2. Magic bytes 检测格式
3. 获取原始尺寸和大小
4. 计算目标大小
```

### 2. 选择压缩策略

```typescript
async function compressImage(
  buffer: Buffer,
  targetSize: number
): Promise<Buffer> {
  const format = detectImageFormat(buffer)
  const { width, height } = getImageDimensions(buffer)
  
  // PNG → 优先 palette optimization
  if (format === 'png') {
    buffer = await optimizePalette(buffer)
  }
  
  // 逐步缩小
  while (getImageSize(buffer) > targetSize) {
    width = Math.floor(width * 0.75)
    height = Math.floor(height * 0.75)
    buffer = await resize(buffer, width, height)
  }
  
  // PNG → JPEG 转换（如果仍过大）
  if (getImageSize(buffer) > targetSize) {
    for (const quality of [80, 60, 40, 20]) {
      buffer = await toJpeg(buffer, { quality })
      if (getImageSize(buffer) <= targetSize) break
    }
  }
  
  return buffer
}
```

### 3. 发送压缩报告

```
Agent:
1. 压缩完成后发送飞书卡片
2. 显示压缩前后对比
3. 记录压缩统计
```

---

## 持久化存储

```json
// memory/image-compression-state.json
{
  "compressions": [
    {
      "originalSize": 2500000,
      "compressedSize": 150000,
      "originalFormat": "png",
      "compressedFormat": "jpeg",
      "strategy": "progressive_resize_jpeg_60",
      "timestamp": "2026-04-12T00:00:00Z"
    }
  ],
  "stats": {
    "totalCompressions": 0,
    "totalBytesSaved": 0,
    "averageReduction": 0
  },
  "config": {
    "targetSizeBytes": 200000,  // 200 KB
    "maxWidth": 1000,
    "maxHeight": 1000,
    "jpegQualityMin": 20
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| imageResizer.ts | Skill + sharp 库 |
| maybeResizeAndDownsampleImageBuffer | compressImage |
| Magic bytes detection | 同样使用 |
| Token limit support | 飞书 token 计算 |
| Terminal notification | 飞书卡片报告 |

---

## 注意事项

1. **sharp 库**：使用 sharp 进行图片处理
2. **Magic bytes**：准确检测图片格式
3. **渐进压缩**：逐步缩小直到达标
4. **质量保证**：最低质量 20，保持可读性
5. **飞书适配**：飞书图片上传前压缩

---

## 自动启用

此 Skill 在图片上传或 token limit 时自动触发。

---

## 下一步增强

- 智能压缩策略选择
- 文字图片优先保持清晰
- 批量图片压缩
- 压缩历史分析