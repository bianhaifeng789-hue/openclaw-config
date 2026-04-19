# LSP Tool Skill

LSP智能工具 - Wait for init + Gitignore filter + Two-step call hierarchy + Formatter。

## 功能概述

从Claude Code的LSPTool提取的LSP模式，用于OpenClaw的代码智能。

## 核心机制

### Wait for Initialization

```typescript
const status = getInitializationStatus()
if (status.status === 'pending') {
  await waitForInitialization()
}
// 防止"no server available"错误
// 等待LSP初始化完成
```

### File Open Check

```typescript
if (!manager.isFileOpen(absolutePath)) {
  const handle = await open(absolutePath, 'r')
  const fileContent = await handle.readFile({ encoding: 'utf-8' })
  await manager.openFile(absolutePath, fileContent)
}
// LSP需要didOpen才能操作
// 只在未打开时读取
```

### Gitignore Filter

```typescript
async function filterGitIgnoredLocations(locations, cwd) {
  const BATCH_SIZE = 50
  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const batch = paths.slice(i, i + BATCH_SIZE)
    const result = await execFile('git', ['check-ignore', ...batch], { cwd })
    if (result.code === 0) {
      ignoredPaths.add(result.stdout.trimmed())
    }
  }
}
// 批量git check-ignore
// 过滤gitignored文件
```

### Two-step Call Hierarchy

```typescript
if (operation === 'incomingCalls' || operation === 'outgoingCalls') {
  // Step 1: prepareCallHierarchy
  const callItems = result as CallHierarchyItem[]
  // Step 2: actual calls request
  const callMethod = operation === 'incomingCalls' 
    ? 'callHierarchy/incomingCalls' 
    : 'callHierarchy/outgoingCalls'
  result = await manager.sendRequest(absolutePath, callMethod, { item: callItems[0] })
}
// Call hierarchy需要两步
// prepare → actual calls
```

### 1-based to 0-based

```typescript
const position = {
  line: input.line - 1,     // 1-based → 0-based
  character: input.character - 1
}
// 用户输入是1-based（编辑器显示）
// LSP协议是0-based
```

### Result Count Extraction

```typescript
function formatResult(operation, result, cwd) {
  switch (operation) {
    case 'goToDefinition': {
      const validLocations = locations.filter(loc => loc && loc.uri)
      return {
        formatted: formatGoToDefinitionResult(result, cwd),
        resultCount: validLocations.length,
        fileCount: countUniqueFiles(validLocations)
      }
    }
  }
}
// 统计result/file数量
// 用于UI summary
```

### Invalid URI Handling

```typescript
const invalidLocations = locations.filter(loc => !loc || !loc.uri)
if (invalidLocations.length > 0) {
  logError(new Error(`LSP server returned ${invalidLocations.length} location(s) with undefined URI`))
}
// 检查invalid URIs
// 防止crash
```

## 实现建议

### OpenClaw适配

1. **waitInit**: 等待初始化
2. **gitignoreFilter**: Git忽略过滤
3. **twoStep**: Call hierarchy两步
4. **formatter**: 结果格式化

### 状态文件示例

```json
{
  "operation": "findReferences",
  "resultCount": 15,
  "fileCount": 5,
  "gitignoredFiltered": 3,
  "lspInitialized": true
}
```

## 关键模式

### Batch Gitignore Check

```
paths → BATCH_SIZE=50 → git check-ignore → filter
// 批量检查
// 避免N次exec
```

### Two-step Call Hierarchy

```
prepareCallHierarchy → CallHierarchyItem → incomingCalls/outgoingCalls
// LSP protocol要求
// 分离prepare和calls
```

### 1-based User Input

```
Editor 1-based → subtract 1 → LSP 0-based
// 用户友好输入
// Protocol转换
```

## 借用价值

- ⭐⭐⭐⭐⭐ Batch gitignore filter
- ⭐⭐⭐⭐⭐ Two-step call hierarchy
- ⭐⭐⭐⭐⭐ Wait for init pattern
- ⭐⭐⭐⭐⭐ Result count extraction
- ⭐⭐⭐⭐ Invalid URI handling
- ⭐⭐⭐⭐ 1-based conversion

## 来源

- Claude Code: `tools/LSPTool/LSPTool.ts` (10KB+)
- 分析报告: P38-13