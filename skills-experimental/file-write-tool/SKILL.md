# File Write Tool Skill

文件写入工具 - Atomic RMW + LSP notify + Mtime staleness + Skill discovery。

## 功能概述

从Claude Code的FileWriteTool提取的文件写入模式，与FileEditTool类似但有独立机制。

## 核心机制

### Atomic RMW Pattern

```typescript
// Load current state and confirm no changes since last read.
// Please avoid async operations between here and writing to disk.
let meta = readFileSyncWithMetadata(fullFilePath)
if (meta !== null) {
  const lastWriteTime = getFileModificationTime(fullFilePath)
  const lastRead = readFileState.get(fullFilePath)
  if (!lastRead || lastWriteTime > lastRead.timestamp) {
    const isFullRead = lastRead && lastRead.offset === undefined && lastRead.limit === undefined
    if (!isFullRead || meta.content !== lastRead.content) {
      throw new Error(FILE_UNEXPECTEDLY_MODIFIED_ERROR)
    }
  }
}
writeTextContent(fullFilePath, content, enc, 'LF')
// NO ASYNC between check and write
// Timestamp staleness check
// Content fallback on Windows
```

### LSP Notify

```typescript
const lspManager = getLspServerManager()
if (lspManager) {
  clearDeliveredDiagnosticsForFile(`file://${fullFilePath}`)
  lspManager.changeFile(fullFilePath, content).catch(...)
  lspManager.saveFile(fullFilePath).catch(...)
}
// didChange + didSave
// Clear diagnostics first
```

### VSCode Notify

```typescript
notifyVscodeFileUpdated(fullFilePath, oldContent, content)
// VSCode diff view
// 跨进程通知
```

### Skill Discovery

```typescript
const newSkillDirs = await discoverSkillDirsForPaths([fullFilePath], cwd)
if (newSkillDirs.length > 0) {
  dynamicSkillDirTriggers?.add(dir)
  addSkillDirectories(newSkillDirs).catch(() => {})  // fire-and-forget
}
activateConditionalSkillsForPaths([fullFilePath], cwd)
// 与FileReadTool相同的skill discovery
// 写入也触发skill加载
```

### File History Backup

```typescript
if (fileHistoryEnabled()) {
  await fileHistoryTrackEdit(updateFileHistoryState, fullFilePath, parentMessage.uuid)
}
// Backup pre-edit content
// Idempotent v1 backup
// Content hash keyed
```

### Read State Update

```typescript
readFileState.set(fullFilePath, {
  content,
  timestamp: getFileModificationTime(fullFilePath),
  offset: undefined,
  limit: undefined
})
// 写入后更新readFileState
// 后续写入可检查staleness
```

### Secret Guard

```typescript
const secretError = checkTeamMemSecrets(fullFilePath, content)
if (secretError) {
  return { result: false, message: secretError, errorCode: 0 }
}
// Team memory文件写入检查
// 防止泄露secrets
```

### Line Ending Preserve

```typescript
// Write is a full content replacement — the model sent explicit line endings
// in `content` and meant them. Do not rewrite them.
writeTextContent(fullFilePath, content, enc, 'LF')
// 不自动转换line endings
// 保留模型发送的格式
```

### Diagnostic Tracker

```typescript
await diagnosticTracker.beforeFileEdited(fullFilePath)
// 写入前通知diagnostic tracker
// 异步track
```

## 实现建议

### OpenClaw适配

1. **atomicRMW**: RMW atomic
2. **lspNotify**: LSP通知
3. **vscodeNotify**: VSCode通知
4. **skillDiscovery**: Skill触发
5. **fileHistory**: History backup

### 状态文件示例

```json
{
  "atomic": true,
  "lspNotify": true,
  "vscodeNotify": true,
  "skillDirsDiscovered": 2,
  "backupCreated": true
}
```

## 关键模式

### Atomic RMW (Same as Edit)

```
Load → Check staleness → NO ASYNC → Write
// 与FileEditTool一致
// Windows content fallback
```

### LSP + VSCode Dual Notify

```
lspManager.changeFile + saveFile + notifyVscodeFileUpdated
// 多进程通知
// 清除旧diagnostics
```

### Skill Discovery (Read + Write)

```
discoverSkillDirsForPaths → fire-and-forget addSkillDirectories
// 写入也触发skill discovery
// 后台加载
```

## 借用价值

- ⭐⭐⭐⭐⭐ Atomic RMW pattern
- ⭐⭐⭐⭐⭐ LSP + VSCode dual notify
- ⭐⭐⭐⭐⭐ Skill discovery trigger
- ⭐⭐⭐⭐ Secret guard
- ⭐⭐⭐⭐ Line ending preserve

## 来源

- Claude Code: `tools/FileWriteTool/FileWriteTool.ts` (10KB+)
- 分析报告: P38-18