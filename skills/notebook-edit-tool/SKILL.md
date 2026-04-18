# Notebook Edit Tool Skill

Notebook编辑工具 - Cell index parse + Replace→Insert fallback + Read-before-edit + Execution reset。

## 功能概述

从Claude Code的NotebookEditTool提取的Jupyter notebook编辑模式，用于OpenClaw的notebook操作。

## 核心机制

### Cell Index Parse

```typescript
const cellIndex = notebook.cells.findIndex(cell => cell.id === cell_id)
if (cellIndex === -1) {
  const parsedCellIndex = parseCellId(cell_id)  // "cell-N" format
  if (parsedCellIndex !== undefined) {
    cellIndex = parsedCellIndex
  }
}
// 先找actual ID
// 再尝试"cell-0"格式
```

### Replace→Insert Fallback

```typescript
if (edit_mode === 'replace' && cellIndex === notebook.cells.length) {
  edit_mode = 'insert'
  cell_type = cell_type ?? 'code'
}
// replace one past end → convert to insert
// 自动处理边界情况
```

### Read-before-Edit

```typescript
const readTimestamp = readFileState.get(fullPath)
if (!readTimestamp) {
  return { result: false, message: 'File has not been read yet', errorCode: 9 }
}
if (getFileModificationTime(fullPath) > readTimestamp.timestamp) {
  return { result: false, message: 'File modified since read', errorCode: 10 }
}
// 与FileEditTool一致
// 必须先Read
```

### Execution Reset

```typescript
if (targetCell.cell_type === 'code') {
  targetCell.execution_count = null
  targetCell.outputs = []
}
// Code cell编辑 → reset execution state
// 清空outputs
```

### Non-memoized JSON Parse

```typescript
// Must use non-memoized jsonParse: safeParseJSON caches by content
// and returns shared object reference, but we mutate in place.
// Using memoized version poisons the cache.
notebook = jsonParse(content) as NotebookContent
// 不用safeParseJSON
// 防止cache污染
```

### New Cell ID Generation

```typescript
if (notebook.nbformat > 4 || (notebook.nbformat === 4 && notebook.nbformat_minor >= 5)) {
  if (edit_mode === 'insert') {
    new_cell_id = Math.random().toString(36).substring(2, 15)
  }
}
// nbformat 4.5+ → 生成random ID
// 符合notebook spec
```

### ReadFileState Update

```typescript
readFileState.set(fullPath, {
  content: updatedContent,
  timestamp: getFileModificationTime(fullPath),
  offset: undefined,  // breaks FileReadTool's dedup
  limit: undefined
})
// 更新state
// offset=undefined防止错误dedup
```

### JSON Indent

```typescript
const IPYNB_INDENT = 1
const updatedContent = jsonStringify(notebook, null, IPYNB_INDENT)
// notebook JSON indent=1
// 保持格式一致
```

## 实现建议

### OpenClaw适配

1. **cellParse**: Cell ID/index解析
2. **replaceFallback**: Replace→Insert fallback
3. **readBeforeEdit**: Read-before-edit
4. **executionReset**: Execution reset

### 状态文件示例

```json
{
  "cellId": "cell-0",
  "editMode": "replace",
  "cellType": "code",
  "executionReset": true,
  "nbformat": 4,
  "readBeforeEdit": true
}
```

## 关键模式

### Dual Cell ID Parse

```
Actual ID → findIndex → if -1 → parseCellId("cell-N")
// ID + index双模式
// 用户友好
```

### Replace→Insert Edge

```
replace + index === length → insert
// 自动边界处理
// 防止错误
```

### Non-memoized Mutate

```
jsonParse (non-memoized) + in-place mutate
// 不污染cache
// 安全修改
```

### Execution Reset Pattern

```
Edit code cell → execution_count=null + outputs=[]
// 重置execution状态
// 表示需要重新运行
```

## 借用价值

- ⭐⭐⭐⭐⭐ Dual cell ID parse
- ⭐⭐⭐⭐⭐ Replace→Insert fallback
- ⭐⭐⭐⭐⭐ Non-memoized JSON parse
- ⭐⭐⭐⭐ Execution reset
- ⭐⭐⭐⭐ ReadFileState update pattern

## 来源

- Claude Code: `tools/NotebookEditTool/NotebookEditTool.ts` (10KB+)
- 分析报告: P38-28