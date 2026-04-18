# Memory Command Skill

记忆文件编辑命令 - Dialog + File Selector + Editor集成。

## 功能概述

从Claude Code的memory/memory.tsx提取的记忆编辑模式，用于OpenClaw的MEMORY.md管理。

## 核心机制

### React组件

```typescript
function MemoryCommand({ onDone }): React.ReactNode {
  return (
    <Dialog title="Memory" onCancel={handleCancel} color="remember">
      <MemoryFileSelector onSelect={handleSelectMemoryFile} />
      <Link url="https://code.claude.com/docs/en/memory" />
    </Dialog>
  )
}
```

### File Creation

```typescript
// Create directory if needed (idempotent)
await mkdir(getClaudeConfigHomeDir(), { recursive: true })

// Create file if doesn't exist (wx flag)
await writeFile(memoryPath, '', { encoding: 'utf8', flag: 'wx' })
// wx fails if exists → preserve content
```

### Editor Integration

```typescript
await editFileInEditor(memoryPath)

// Editor detection:
if (process.env.VISUAL) editorSource = '$VISUAL'
else if (process.env.EDITOR) editorSource = '$EDITOR'
```

### Cache Clear + Prime

```typescript
clearMemoryFileCaches()
await getMemoryFiles()
// Clear + prime before rendering
// Avoids fallback flash
```

### Suspense Pattern

```typescript
<React.Suspense fallback={null}>
  <MemoryFileSelector ... />
</React.Suspense>
// Suspense handles unprimed case
```

### Error Handling

```typescript
catch (e) {
  if (getErrnoCode(e) !== 'EEXIST') throw e
  // EEXIST is expected → preserve existing content
}
```

## 实现建议

### OpenClaw适配

1. **dialog**: Dialog组件
2. **file selector**: MemoryFileSelector
3. **editor**: VISUAL/EDITOR环境变量
4. **cache**: 清除缓存避免闪烁

### 状态文件示例

```json
{
  "dialogTitle": "Memory",
  "color": "remember",
  "editor": "$VISUAL=vim",
  "files": ["MEMORY.md", "CLAUDE.local.md"]
}
```

## 关键模式

### Idempotent Creation

```typescript
mkdir({ recursive: true })
writeFile({ flag: 'wx' })
// wx: write exclusive, fails if exists
// Preserve existing content
```

### Cache Prime

```typescript
clearMemoryFileCaches()
await getMemoryFiles()
// Prime before render
// Avoid Suspense fallback flash
```

### Editor Detection

```
VISUAL > EDITOR > default
// VISUAL优先（通常用于visual editors）
// EDITOR fallback
```

## 借用价值

- ⭐⭐⭐⭐ Dialog + Selector模式
- ⭐⭐⭐⭐ Idempotent file creation
- ⭐⭐⭐⭐ Editor integration
- ⭐⭐⭐⭐ Cache prime避免闪烁

## 来源

- Claude Code: `commands/memory/memory.tsx`
- 分析报告: P36-3