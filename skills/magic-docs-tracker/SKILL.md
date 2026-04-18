# Magic Docs Tracker Skill

自动文档追踪 - 维护带有特殊header的markdown文档。

## 功能概述

从Claude Code的MagicDocs.ts提取的自动文档维护模式，用于OpenClaw的智能文档更新。

## Header Pattern

### 文档标识

```typescript
/^#\s*MAGIC\s+DOC:\s*(.+)$/im  // 标题行
// 例: # MAGIC DOC: Project Architecture

/^[_*](.+?)[_*]\s*$/m  // 斜体指令（header后第一行）
// 例: *Auto-update with learnings from conversation*
```

### 检测示例

```markdown
# MAGIC DOC: API Reference
*Keep this document updated with latest API changes*

## Endpoints
...
```

## 核心机制

### 注册追踪

```typescript
registerFileReadListener((filePath, content) => {
  if (detectMagicDocHeader(content)) {
    registerMagicDoc(filePath)
  }
})
```

只在首次Read时注册，后续读取自动获取最新内容。

### 后台更新

```typescript
registerPostSamplingHook(updateMagicDocs)
// 条件：
// - querySource === 'repl_main_thread'
// - 无tool calls in last turn (idle状态)
// - trackedMagicDocs.size > 0
```

### 工具限制

更新时只允许Edit目标文件：

```typescript
canUseTool = async (tool, input) => {
  if (tool.name === 'FileEditTool' && input.file_path === docInfo.path) {
    return { behavior: 'allow' }
  }
  return { behavior: 'deny' }
}
```

### Content Re-detection

每次更新前重新读取并检测header：

```typescript
const currentDoc = await FileReadTool.call({ file_path }, context)
const detected = detectMagicDocHeader(currentDoc)
if (!detected) {
  trackedMagicDocs.delete(path)  // header消失，停止追踪
  return
}
```

### FileState Clone

防止dedup返回file_unchanged stub：

```typescript
const clonedReadFileState = cloneFileStateCache(context.readFileState)
clonedReadFileState.delete(docInfo.path)
```

## 实现建议

### OpenClaw适配

1. **标识**: 使用类似的header pattern
2. **追踪**: Read时检测并注册
3. **更新**: heartbeat或postSampling时触发
4. **限制**: 只允许Edit目标文件

### 状态文件示例

```json
{
  "trackedDocs": [
    {
      "path": "memory/API-Reference.md",
      "title": "API Reference",
      "instructions": "Keep updated with latest changes",
      "lastUpdateAt": 1703275200
    }
  ]
}
```

## 关键模式

### 追踪Map

```typescript
trackedMagicDocs = new Map<string, MagicDocInfo>()
// key: filePath
// value: { path }
```

### Sequential Wrapper

```typescript
updateMagicDocs = sequential(async function(context) { ... })
// 保证一次只有一个update任务
```

## 借用价值

- ⭐⭐⭐ 自动追踪减轻维护负担
- ⭐⭐⭐ 工具限制保证安全
- ⭐⭐⭐ Re-detection防止header消失后继续

## 来源

- Claude Code: `services/MagicDocs/magicDocs.ts`
- 分析报告: P33-4