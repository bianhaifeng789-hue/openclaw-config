# Format Utils Skill

**优先级**: P29
**来源**: Claude Code `format.ts`
**适用场景**: 文件大小、时长、数字格式化

---

## 概述

Format Utils提供显示格式化函数：文件大小（KB/MB/GB）、时长（1.2s、1d 2h）、数字（1.3k）、相对时间。NumberFormat缓存避免重复创建。

---

## 核心功能

### 1. 文件大小

```typescript
export function formatFileSize(sizeInBytes: number): string {
  const kb = sizeInBytes / 1024
  if (kb < 1) return `${sizeInBytes} bytes`
  if (kb < 1024) return `${kb.toFixed(1).replace(/\.0$/, '')}KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1).replace(/\.0$/, '')}MB`
  const gb = mb / 1024
  return `${gb.toFixed(1).replace(/\.0$/, '')}GB`
}
```

### 2. 秒数（带小数）

```typescript
export function formatSecondsShort(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}
// 1234 → "1.2s"
```

### 3. Duration

```typescript
export function formatDuration(
  ms: number,
  options?: { hideTrailingZeros?: boolean; mostSignificantOnly?: boolean }
): string
// < 1s: "0.5s", "5s"
// >= 1m: "5m", "1h 5m", "1d 2h"
```

### 4. 数字紧凑格式

```typescript
export function formatNumber(number: number): string {
  const shouldUseConsistentDecimals = number >= 1000
  return getNumberFormatter(shouldUseConsistentDecimals)
    .format(number)
    .toLowerCase()
}
// 1321 → "1.3k"
// 900 → "900"
```

---

## OpenClaw应用

### 1. 飞书文件大小显示

```typescript
const fileSize = formatFileSize(file.bytes)
// 在飞书卡片中显示
{
  "elements": [{
    "tag": "div",
    "text": {
      "content": `文件大小: ${fileSize}`,
      "tag": "plain_text"
    }
  }]
}
```

### 2. 飞书时长显示

```typescript
const duration = formatDuration(task.durationMs)
const shortDuration = formatSecondsShort(apiResponseTime)
```

---

## 状态文件

```json
{
  "skill": "format-utils",
  "priority": "P29",
  "source": "format.ts",
  "enabled": true,
  "formats": ["fileSize", "secondsShort", "duration", "number", "relativeTime"],
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `format.ts`