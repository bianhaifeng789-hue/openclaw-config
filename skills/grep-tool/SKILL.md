# Grep Tool Skill

搜索工具 - Head_limit pagination + VCS exclusion + Mtime sort + Path relativize。

## 功能概述

从Claude Code的GrepTool提取的搜索模式，用于OpenClaw的文件内容搜索。

## 核心机制

### Head Limit Pagination

```typescript
const DEFAULT_HEAD_LIMIT = 250

function applyHeadLimit<T>(items: T[], limit?: number, offset = 0) {
  if (limit === 0) return { items: items.slice(offset), appliedLimit: undefined }
  const effectiveLimit = limit ?? DEFAULT_HEAD_LIMIT
  const sliced = items.slice(offset, offset + effectiveLimit)
  const wasTruncated = items.length - offset > effectiveLimit
  return { items: sliced, appliedLimit: wasTruncated ? effectiveLimit : undefined }
}
// head_limit=250默认
// 0表示无限制（escape hatch）
// offset支持分页
```

### VCS Directory Exclusion

```typescript
const VCS_DIRECTORIES_TO_EXCLUDE = ['.git', '.svn', '.hg', '.bzr', '.jj', '.sl']

for (const dir of VCS_DIRECTORIES_TO_EXCLUDE) {
  args.push('--glob', `!${dir}`)
}
// 自动排除版本控制目录
// 避免噪音
```

### Mtime Sort

```typescript
const stats = await Promise.allSettled(results.map(_ => fs.stat(_)))
const sortedMatches = results
  .map((_, i) => [_, r.status === 'fulfilled' ? r.value.mtimeMs ?? 0 : 0])
  .sort((a, b) => b[1] - a[1])  // newest first
// 按修改时间排序
// 最近修改的文件优先
```

### Path Relativize

```typescript
// For content mode
const finalLines = limitedResults.map(line => {
  const colonIndex = line.indexOf(':')
  const filePath = line.substring(0, colonIndex)
  return toRelativePath(filePath) + rest
})
// Absolute → Relative
// 节省tokens
```

### Output Modes

```typescript
output_mode: z.enum(['content', 'files_with_matches', 'count'])
// content: 显示匹配行（支持-A/-B/-C）
// files_with_matches: 显示文件路径
// count: 显示匹配次数
```

### Context Flags

```typescript
if (output_mode === 'content') {
  if (context !== undefined) args.push('-C', context.toString())
  else {
    if (context_before) args.push('-B', context_before.toString())
    if (context_after) args.push('-A', context_after.toString())
  }
}
// -C优先于-B/-A
// 只在content mode有效
```

### Max Columns

```typescript
args.push('--max-columns', '500')
// 限制行长度
// 防止base64/minified内容污染输出
```

## 实现建议

### OpenClaw适配

1. **pagination**: head_limit + offset
2. **vcsExclude**: VCS目录排除
3. **mtimeSort**: 时间排序
4. **relativize**: 路径相对化
5. **modes**: 多输出模式

### 状态文件示例

```json
{
  "mode": "files_with_matches",
  "numFiles": 15,
  "appliedLimit": 250,
  "appliedOffset": 0,
  "vcsExcluded": true
}
```

## 关键模式

### Pagination with Escape Hatch

```
Default 250 → Explicit 0 = unlimited
// 防止context bloat
// 用户可escape
```

### Mtime Priority

```
files_with_matches → sort by mtime → newest first
// 最近修改更可能relevant
// 优先显示
```

### Absolute → Relative

```
ripgrep返回absolute → toRelativePath → save tokens
// 输出优化
// 节省context
```

## 借用价值

- ⭐⭐⭐⭐⭐ Pagination with escape hatch
- ⭐⭐⭐⭐⭐ VCS exclusion
- ⭐⭐⭐⭐⭐ Mtime sort priority
- ⭐⭐⭐⭐⭐ Path relativize
- ⭐⭐⭐⭐⭐ Output modes design
- ⭐⭐⭐⭐ Max columns guard

## 来源

- Claude Code: `tools/GrepTool/GrepTool.ts` (10KB+)
- 分析报告: P38-11