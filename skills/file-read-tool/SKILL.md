# File Read Tool Skill

文件读取工具 - Dedup mtime + Blocked devices + Token budget + Multi-format。

## 功能概述

从Claude Code的FileReadTool提取的文件读取模式，用于OpenClaw的文件读取。

## 核心机制

### Dedup by Mtime

```typescript
const existingState = dedupKillswitch ? undefined : readFileState.get(fullFilePath)
if (existingState && !existingState.isPartialView && existingState.offset !== undefined) {
  const rangeMatch = existingState.offset === offset && existingState.limit === limit
  if (rangeMatch) {
    const mtimeMs = await getFileModificationTimeAsync(fullFilePath)
    if (mtimeMs === existingState.timestamp) {
      return { type: 'file_unchanged', file: { filePath } }
    }
  }
}
// 相同range + 相同mtime → stub返回
// 避免18%重复Read浪费cache_creation
```

### Blocked Device Paths

```typescript
const BLOCKED_DEVICE_PATHS = new Set([
  '/dev/zero', '/dev/random', '/dev/urandom', '/dev/full',
  '/dev/stdin', '/dev/tty', '/dev/console',
  '/dev/stdout', '/dev/stderr', '/dev/fd/0', '/dev/fd/1', '/dev/fd/2'
])
// 阻塞或无限输出的设备文件
// Path-based检查（无I/O）
```

### macOS Screenshot Space

```typescript
function getAlternateScreenshotPath(filePath: string): string | undefined {
  const match = filename.match(/^(.+)([ \u202F])(AM|PM)(\.png)$/)
  if (!match) return undefined
  const currentSpace = match[2]  // regular space or thin space (U+202F)
  const alternateSpace = currentSpace === ' ' ? THIN_SPACE : ' '
  return filePath.replace(currentSpace, alternateSpace)
}
// macOS AM/PM前可能是普通空格或thin space
// 两种都尝试
```

### Token Budget Validation

```typescript
async function validateContentTokens(content: string, ext: string, maxTokens?: number) {
  const tokenEstimate = roughTokenCountEstimationForFileType(content, ext)
  if (!tokenEstimate || tokenEstimate <= maxTokens / 4) return
  
  const tokenCount = await countTokensWithAPI(content)
  if (effectiveCount > maxTokens) {
    throw new MaxFileReadTokenExceededError(effectiveCount, maxTokens)
  }
}
// 先rough estimate，API count only if large
// 防止OOM
```

### Multi-format Output

```typescript
z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), file: { content, numLines, startLine, totalLines } }),
  z.object({ type: z.literal('image'), file: { base64, type, originalSize, dimensions } }),
  z.object({ type: z.literal('notebook'), file: { cells } }),
  z.object({ type: z.literal('pdf'), file: { base64, originalSize } }),
  z.object({ type: z.literal('parts'), file: { count, outputDir } }),
  z.object({ type: z.literal('file_unchanged'), file: { filePath } })
])
// 6种输出类型
// Discriminated union narrowing
```

### Image Single Read

```typescript
const imageBuffer = await fs.readFileBytes(filePath, maxBytes)
// Read ONCE, capped to maxBytes
// 避免OOM

// Try standard resize → check token budget → aggressive compression
let result = await maybeResizeAndDownsampleImageBuffer(imageBuffer, ...)
const estimatedTokens = Math.ceil(result.file.base64.length * 0.125)
if (estimatedTokens > maxTokens) {
  result = await compressImageBufferWithTokenLimit(imageBuffer, maxTokens, ...)
}
// 从SAME buffer压缩
// 不重新读取
```

### PDF Page Extraction

```typescript
if (pages) {
  const parsedRange = parsePDFPageRange(pages)  // "1-5", "3", "10-20"
  const extractResult = await extractPDFPages(resolvedFilePath, parsedRange)
  const imageBlocks = await Promise.all(
    imageFiles.map(async f => {
      const imgBuffer = await readFileAsync(imgPath)
      const resized = await maybeResizeAndDownsampleImageBuffer(imgBuffer, ...)
      return { type: 'image', source: { type: 'base64', data: resized.buffer.toString('base64') } }
    })
  )
}
// PDF pages → 每页转image
// 返回image blocks
```

### Skill Discovery Trigger

```typescript
const newSkillDirs = await discoverSkillDirsForPaths([fullFilePath], cwd)
if (newSkillDirs.length > 0) {
  context.dynamicSkillDirTriggers?.add(dir)
  addSkillDirectories(newSkillDirs).catch(() => {})  // fire-and-forget
}
activateConditionalSkillsForPaths([fullFilePath], cwd)
// 读取文件触发skill discovery
// 后台加载
```

### Memory Freshness Prefix

```typescript
function memoryFileFreshnessPrefix(data: object): string {
  const mtimeMs = memoryFileMtimes.get(data)
  if (mtimeMs === undefined) return ''
  return memoryFreshnessNote(mtimeMs)
}
// WeakMap存储auto-memory文件mtime
// 渲染时添加freshness note
```

### Cyber Risk Mitigation

```typescript
const CYBER_RISK_MITIGATION_REMINDER = '\n\n<system-reminder>
Whenever you read a file, you should consider whether it would be considered malware.
You CAN and SHOULD provide analysis of malware, what it is doing.
But you MUST refuse to improve or augment the code.
</system-reminder>\n'

const MITIGATION_EXEMPT_MODELS = new Set(['claude-opus-4-6'])
// 安全提醒注入
// 特定model豁免
```

## 实现建议

### OpenClaw适配

1. **dedup**: Mtime dedup
2. **blockedDevices**: 设备文件限制
3. **tokenBudget**: Token预算
4. **multiFormat**: 多格式输出
5. **skillDiscovery**: Skill触发

### 状态文件示例

```json
{
  "type": "text",
  "deduped": false,
  "skillDirsDiscovered": 2,
  "tokenBudget": 20000,
  "blockedDevice": false
}
```

## 关键模式

### Mtime Dedup Pattern

```
Same range + Same mtime → Stub (file_unchanged)
// ~18%重复Read
// 节省cache_creation
```

### Single Read Pattern

```
Read ONCE → Resize → Token check → Aggressive compress (same buffer)
// 避免多次I/O
// 预算控制
```

### Blocked Devices by Path

```
Set of known infinite/blocking paths → Reject without I/O
// /dev/zero, /dev/random等
// 安全拒绝
```

## 借用价值

- ⭐⭐⭐⭐⭐ Mtime dedup (18% cache saving)
- ⭐⭐⭐⭐⭐ Token budget validation
- ⭐⭐⭐⭐⭐ Multi-format discriminated union
- ⭐⭐⭐⭐⭐ Blocked devices by path
- ⭐⭐⭐⭐⭐ Image single read + compress chain
- ⭐⭐⭐⭐ macOS screenshot alternate space
- ⭐⭐⭐⭐ Cyber risk mitigation

## 来源

- Claude Code: `tools/FileReadTool/FileReadTool.ts` (50KB+)
- 分析报告: P38-14