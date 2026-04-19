# Tempfile Utils Skill

**优先级**: P30
**来源**: Claude Code `tempfile.ts`
**适用场景**: 稳定临时文件路径生成

---

## 概述

Tempfile Utils生成临时文件路径，支持 `contentHash`选项实现跨进程稳定路径（相同内容 → 相同路径）。用于sandbox deny list等场景。

---

## 核心功能

### 1. 随机路径

```typescript
export function generateTempFilePath(
  prefix: string = 'claude-prompt',
  extension: string = '.md'
): string {
  const id = randomUUID()
  return join(tmpdir(), `${prefix}-${id}${extension}`)
}
```

### 2. 稳定路径

```typescript
export function generateTempFilePath(
  prefix: string = 'claude-prompt',
  extension: string = '.md',
  options?: { contentHash?: string }
): string {
  const id = options?.contentHash
    ? createHash('sha256')
        .update(options.contentHash)
        .digest('hex')
        .slice(0, 16)
    : randomUUID()
  return join(tmpdir(), `${prefix}-${id}${extension}`)
}
```

---

## 实现要点

### 1. Content Hash稳定性

```typescript
// 相同content → 相同path（跨进程）
// 用于sandbox deny list等场景
// 避免每次subprocess spawn生成不同path → bust prompt cache

const denyListPath = generateTempFilePath('sandbox-deny', '.txt', {
  contentHash: JSON.stringify(denyList)
})
// 多个进程使用相同denyList → 相同path
```

---

## OpenClaw应用

### 1. 飞书临时文件

```typescript
// 导出文件临时路径
const tempPath = generateTempFilePath('feishu-export', '.xlsx')

// 稳定配置文件路径
const configPath = generateTempFilePath('openclaw-config', '.json', {
  contentHash: JSON.stringify(config)
})
```

---

## 状态文件

```json
{
  "skill": "tempfile-utils",
  "priority": "P30",
  "source": "tempfile.ts",
  "enabled": true,
  "defaultPrefix": "claude-prompt",
  "defaultExtension": ".md",
  "contentHashSupport": true,
  "createdAt": "2026-04-12T13:30:00Z"
}
```

---

## 参考

- Claude Code: `tempfile.ts`