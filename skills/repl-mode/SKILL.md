---
name: repl-mode
description: "REPL 交互模式，支持批量操作和工具隐藏 Use when [repl mode] is needed."
triggers:
  - repl
  - batch
  - 批量
  - 交互模式
  - 原始工具
---

# REPL Mode Service

REPL 交互模式，借鉴 Claude Code 的 REPLTool 模块。

## 功能

- **REPL 模式切换**: 启用/禁用 REPL 模式
- **工具隐藏**: 隐藏原始工具，强制通过 REPL 执行
- **批量操作**: 执行多个命令的一次性批处理
- **虚拟消息**: 折叠显示读取/搜索结果

## REPL_ONLY_TOOLS

REPL 模式下隐藏的原始工具：
- FileReadTool
- FileWriteTool
- FileEditTool
- GlobTool
- GrepTool
- BashTool
- NotebookEditTool
- AgentTool

## 使用场景

- 需要批量执行多个文件操作
- 折叠显示大量读取结果
- 飞书场景的交互式操作

## API

```typescript
import { ReplProcessor, replModeService } from './repl-mode-service';

// 检查 REPL 是否启用
if (replModeService.isReplEnabled()) {
  // 创建处理器
  const processor = replModeService.createProcessor();
  
  // 创建批量命令
  const batch = processor.createBatch([
    { type: 'read', args: { path: 'file1.txt' } },
    { type: 'read', args: { path: 'file2.txt' } },
    { type: 'grep', args: { pattern: 'error' } },
  ]);
  
  // 执行批量
  await processor.executeBatch(batch.id);
}

// 检查工具是否隐藏
if (replModeService.isToolHidden('FileReadTool')) {
  console.log('FileReadTool 被 REPL 模式隐藏');
}
```

## Stats

- batchesCreated: 创建的批次数
- commandsExecuted: 执行的命令数

## 文件

- `impl/utils/repl-mode-service.ts`