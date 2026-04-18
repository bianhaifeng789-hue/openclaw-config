# File Edit Tool Skill

文件编辑工具 - Atomic RMW + Staleness check + LSP notify + Skill discovery。

## 功能概述

从Claude Code的FileEditTool提取的文件编辑模式，用于OpenClaw的文件修改。

## 核心机制

### Atomic Read-Modify-Write

```typescript
// CRITICAL SECTION - no async between staleness check and write
const lastWriteTime = getFileModificationTime(absoluteFilePath)
const lastRead = readFileState.get(absoluteFilePath)
if (lastWriteTime > lastRead.timestamp) {
  throw new Error(FILE_UNEXPECTEDLY_MODIFIED_ERROR)
}
// ... immediate write ...
writeTextContent(absoluteFilePath, updatedFile, encoding, endings)
// 原子性：检查后立即写入
// 避免并发编辑冲突
```

### Staleness Check with Fallback

```typescript
const isFullRead = lastRead.offset === undefined && lastRead.limit === undefined
const contentUnchanged = isFullRead && originalFileContents === lastRead.content
if (!contentUnchanged) throw new Error(FILE_UNEXPECTEDLY_MODIFIED_ERROR)
// Windows timestamp可能误报
// Full read时比较内容作为fallback
```

### LSP Notification

```typescript
const lspManager = getLspServerManager()
clearDeliveredDiagnosticsForFile(`file://${absoluteFilePath}`)
lspManager.changeFile(absoluteFilePath, updatedFile).catch(...)
lspManager.saveFile(absoluteFilePath).catch(...)
// didChange + didSave
// 触发diagnostics刷新
```

### Skill Discovery

```typescript
const newSkillDirs = await discoverSkillDirsForPaths([absoluteFilePath], cwd)
if (newSkillDirs.length > 0) {
  dynamicSkillDirTriggers?.add(dir)
  addSkillDirectories(newSkillDirs).catch(() => {})  // fire-and-forget
}
activateConditionalSkillsForPaths([absoluteFilePath], cwd)
// 编辑文件触发skill discovery
// 自动加载相关skills
```

### Secret Guard

```typescript
const secretError = checkTeamMemSecrets(fullFilePath, new_string)
if (secretError) {
  return { result: false, message: secretError, errorCode: 0 }
}
// Team memory文件不允许写入secrets
// 安全检查
```

### Quote Style Preservation

```typescript
const actualNewString = preserveQuoteStyle(old_string, actualOldString, new_string)
// 文件使用curly quotes时保持风格
// 避免风格破坏
```

### File History Backup

```typescript
if (fileHistoryEnabled()) {
  await fileHistoryTrackEdit(updateFileHistoryState, absoluteFilePath, parentMessage.uuid)
}
// 编辑前备份
// 支持undo历史
```

## 实现建议

### OpenClaw适配

1. **atomicRMW**: 原子读写
2. **staleness**: 过期检查
3. **lspNotify**: LSP通知
4. **skillDiscovery**: Skill发现
5. **secretGuard**: Secret检查

### 状态文件示例

```json
{
  "filePath": "/Users/mac/test.ts",
  "staleCheckPassed": true,
  "lspNotified": true,
  "skillsDiscovered": 2,
  "backupCreated": true
}
```

## 关键模式

### Atomic Critical Section

```
staleness check → NO ASYNC → write
// 任何yield都可能引入并发编辑
// 必须紧凑执行
```

### Staleness with Fallback

```
timestamp changed → compare content → reject if different
// Windows兼容
// 避免false positive
```

### Fire-and-forget Skill Discovery

```
discover → add (async, catch errors) → activate
// 不阻塞编辑
// 后台加载
```

## 借用价值

- ⭐⭐⭐⭐⭐ Atomic RMW pattern
- ⭐⭐⭐⭐⭐ Staleness with fallback
- ⭐⭐⭐⭐⭐ LSP notification chain
- ⭐⭐⭐⭐⭐ Skill discovery trigger
- ⭐⭐⭐⭐⭐ Secret guard
- ⭐⭐⭐⭐ Quote style preservation

## 来源

- Claude Code: `tools/FileEditTool/FileEditTool.ts` (40KB+)
- 分析报告: P38-10