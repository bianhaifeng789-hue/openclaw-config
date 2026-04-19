---
name: context-collapse
description: |
  Collapse repetitive read/search tool calls into summary lines to reduce context token usage.
  
  Use when:
  - Multiple consecutive file reads or searches in a session
  - Context window is getting large
  - Repeated bash/grep/glob operations
  - Hook summaries need aggregation
  
  Keywords: collapse, context, token, summarize reads, fold messages
metadata:
  openclaw:
    emoji: "📦"
    source: claude-code-collapse
    triggers: [context-large, repeated-reads, token-warning]
    priority: P2
---

# Context Collapse

基于 Claude Code `collapseReadSearch` 系列工具的上下文折叠机制，减少重复操作的 token 占用。

## 核心概念（来自 Claude Code）

Claude Code 有 4 个 collapse 工具：

### 1. collapseReadSearch
把连续的读/搜索操作折叠成一行摘要：
```
[已读取 5 个文件，搜索 3 次] → 展开查看详情
```

**可折叠的操作**：
- FileRead、FileWrite（内存文件）
- Glob、Grep
- REPL 工具
- MCP 工具（分类后）
- ToolSearch（静默吸收）

**不可折叠**：
- Bash 命令（除非 fullscreen 模式）
- AgentTool
- 写操作（非内存文件）

### 2. collapseHookSummaries
把多个 hook 执行摘要折叠：
```
[3 个 hooks 执行完成: 2 成功, 1 警告]
```

### 3. collapseTeammateShutdowns
把 teammate agent 关闭消息折叠：
```
[2 个 agents 已完成]
```

### 4. collapseBackgroundBashNotifications
把后台 bash 通知折叠：
```
[5 个后台命令已完成]
```

## OpenClaw 适配实现

### 何时触发折叠

在以下情况检查是否需要折叠：
1. 连续 3+ 次读/搜索操作
2. 上下文 token 超过 50% 警告线
3. 用户明确要求"压缩上下文"

### 折叠策略

```
检测连续读/搜索序列:
  - 统计连续的 read/search 工具调用
  - 如果 >= 3 个连续操作：
    生成摘要: "读取了 N 个文件 (file1, file2, ...)"
    替换为单行摘要
    保留最后一个完整结果

统计信息:
  - searchCount: 搜索次数
  - readCount: 读取次数  
  - fileList: 涉及的文件列表（最多显示 5 个）
```

### summarizeRecentActivities（来自 Claude Code）

```typescript
// 统计末尾连续的 search/read 活动
function summarizeRecentActivities(activities) {
  let searchCount = 0, readCount = 0
  for (let i = activities.length - 1; i >= 0; i--) {
    if (activities[i].isSearch) searchCount++
    else if (activities[i].isRead) readCount++
    else break  // 遇到非 read/search 停止
  }
  
  if (searchCount > 0 && readCount > 0)
    return `搜索 ${searchCount} 次，读取 ${readCount} 个文件`
  if (searchCount > 0) return `搜索 ${searchCount} 次`
  if (readCount > 0) return `读取 ${readCount} 个文件`
}
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 触发时机 | 渲染时自动折叠 | 手动/上下文警告时触发 |
| 展示 | TUI 可展开组件 | 飞书文本摘要 |
| 粒度 | 消息级别 | 工具调用批次级别 |

## 使用示例

当检测到大量读操作时，在回复中使用折叠摘要：

```
[已扫描 12 个文件: src/utils/*.ts (8个), src/services/*.ts (4个)]
关键发现: ...
```

而不是逐一列出每个文件的读取结果。
