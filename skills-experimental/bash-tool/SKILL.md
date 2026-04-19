# Bash Tool Skill

Shell执行工具 - Search/Read分类 + Sandbox + Permission rules。

## 功能概述

从Claude Code的BashTool.tsx提取的shell执行模式，用于OpenClaw的命令执行。

## 核心机制

### Command Classification

```typescript
const BASH_SEARCH_COMMANDS = new Set(['find', 'grep', 'rg', 'ag', 'ack'])
const BASH_READ_COMMANDS = new Set(['cat', 'head', 'tail', 'less', 'wc', 'jq'])
const BASH_LIST_COMMANDS = new Set(['ls', 'tree', 'du'])
const BASH_SILENT_COMMANDS = new Set(['mv', 'cp', 'rm', 'mkdir', 'chmod'])

export function isSearchOrReadBashCommand(command): {
  isSearch: boolean, isRead: boolean, isList: boolean
}
// 命令分类 → UI collapsing决策
```

### Pipeline Analysis

```typescript
// For pipelines, ALL parts must be search/read
// Semantic-neutral commands (echo, printf) skipped
partsWithOperators = splitCommandWithOperators(command)
// 分析compound和pipeline命令
```

### Permission Rules

```typescript
bashToolHasPermission(command, permissionContext)
// Wildcard patterns: Bash(git:*), Bash(rm:*)
// Prefix matching
```

### Sandbox Execution

```typescript
if (shouldUseSandbox(command, context)) {
  const sandboxManager = new SandboxManager()
  result = await exec(command, { sandbox: sandboxManager })
}
// 安全命令在sandbox中执行
```

### Timeout Management

```typescript
const timeoutMs = getDefaultTimeoutMs(command)  // 基于命令类型
const maxTimeoutMs = getMaxTimeoutMs()  // 系统上限

// Assistant mode: auto-background after 15s
const ASSISTANT_BLOCKING_BUDGET_MS = 15_000
```

### Background Task

```typescript
if (isBackground) {
  const taskId = await spawnShellTask(command, context)
  registerForeground(taskId)
  // 长时间任务后台执行
}
```

## 实现建议

### OpenClaw适配

1. **classification**: Search/Read/List/Silent
2. **permission**: Wildcard rules
3. **sandbox**: 安全执行
4. **timeout**: 动态超时
5. **background**: 后台任务

### 状态文件示例

```json
{
  "command": "git status",
  "classification": { "isSearch": false, "isRead": true },
  "sandbox": false,
  "timeoutMs": 30000
}
```

## 关键模式

### Command Classification for UI

```
Search → collapsible search section
Read → collapsible read section
List → collapsible list section
Silent → minimal display
// 分类决定UI显示
```

### Pipeline Validation

```
ALL parts must match classification
// cat file | grep → not collapsible (mixed)
// cat file | jq → collapsible (both read)
```

### Dynamic Timeout

```
Simple commands: short timeout
Complex commands: longer timeout
// 基于命令类型调整
```

## 借用价值

- ⭐⭐⭐⭐⭐ Command classification
- ⭐⭐⭐⭐⭐ Pipeline analysis
- ⭐⭐⭐⭐ Sandbox execution
- ⭐⭐⭐⭐ Dynamic timeout
- ⭐⭐⭐⭐ Background task pattern

## 来源

- Claude Code: `tools/BashTool/BashTool.tsx` (50KB+)
- 分析报告: P38-5