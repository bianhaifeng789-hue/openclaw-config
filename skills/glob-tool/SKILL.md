# Glob Tool Skill

文件查找工具 - Truncated flag + Duration tracking + Path relativize。

## 功能概述

从Claude Code的GlobTool提取的glob模式，用于OpenClaw的文件查找。

## 核心机制

### Truncated Flag

```typescript
const limit = globLimits?.maxResults ?? 100
const { files, truncated } = await glob(input.pattern, path, { limit, offset: 0 })

return {
  filenames,
  truncated,  // true if > 100
  ...
}
// 默认100结果限制
// truncated=true表示有更多
```

### Duration Tracking

```typescript
const start = Date.now()
const { files, truncated } = await glob(...)
const output: Output = {
  filenames,
  durationMs: Date.now() - start,  // 执行时间
  numFiles: filenames.length,
  truncated
}
// 记录搜索耗时
// 用于性能分析
```

### Path Relativize

```typescript
const filenames = files.map(toRelativePath)
// Absolute → Relative
// 节省tokens
// 与GrepTool一致
```

### Output Schema

```typescript
z.object({
  durationMs: z.number().describe('Time in milliseconds'),
  numFiles: z.number().describe('Total number of files'),
  filenames: z.array(z.string()).describe('Matching file paths'),
  truncated: z.boolean().describe('Whether limited to 100 files')
})
// 包含truncated flag
// 用户知道是否需要缩小pattern
```

### Result Message

```typescript
if (output.filenames.length === 0) {
  return { content: 'No files found' }
}
return {
  content: [
    ...output.filenames,
    ...(output.truncated ? ['(Results are truncated. Consider using a more specific path or pattern.)'] : [])
  ].join('\n')
}
// 空结果友好提示
// truncated给出指导
```

### Directory Validation

```typescript
if (path) {
  const stats = await fs.stat(absolutePath)
  if (!stats.isDirectory()) {
    return { result: false, message: 'Path is not a directory', errorCode: 2 }
  }
}
// 确保path是目录
// 防止错误glob
```

## 实现建议

### OpenClaw适配

1. **truncated**: 结果截断标记
2. **duration**: 执行时间追踪
3. **relativize**: 路径相对化
4. **guidance**: Truncated提示

### 状态文件示例

```json
{
  "pattern": "*.ts",
  "numFiles": 15,
  "durationMs": 12,
  "truncated": false,
  "relativized": true
}
```

## 关键模式

### Truncated + Guidance

```
limit=100 → truncated=true → "Consider more specific pattern"
// 用户知道有更多结果
// 提供改进建议
```

### Duration Tracking

```
start → glob → Date.now() - start
// 简单耗时追踪
// 性能分析数据
```

### Relativize All Paths

```
Absolute paths → toRelativePath → save tokens
// 与GrepTool一致
// Context优化
```

## 借用价值

- ⭐⭐⭐⭐ Truncated + guidance pattern
- ⭐⭐⭐⭐ Duration tracking
- ⭐⭐⭐⭐ Path relativize
- ⭐⭐⭐ Output schema design

## 来源

- Claude Code: `tools/GlobTool/GlobTool.ts` (4KB)
- 分析报告: P38-15