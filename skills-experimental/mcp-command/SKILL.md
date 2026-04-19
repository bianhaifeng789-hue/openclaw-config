# MCP Command Skill

MCP服务器管理 - Immediate模式 + Enable/Disable操作。

## 功能概述

从Claude Code的mcp/index.ts提取的MCP管理模式，用于OpenClaw的MCP服务器配置。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'mcp',
  description: 'Manage MCP servers',
  immediate: true,
  argumentHint: '[enable|disable [server-name]]',
  load: () => import('./mcp.js')
}
```

### Immediate Mode

```typescript
immediate: true
// MCP管理立即执行
// 不需要等待turn end
```

### Argument Hint

```typescript
argumentHint: '[enable|disable [server-name]]'
// 显示操作类型和可选server
// enable/disable + server名称
```

### Operations

```
enable <server-name>  - 启用MCP服务器
disable <server-name> - 禁用MCP服务器
(no args)             - 显示所有servers状态
```

## 实现建议

### OpenClaw适配

1. **immediate**: 立即执行
2. **argumentHint**: 显示操作格式
3. **operations**: enable/disable

### 状态文件示例

```json
{
  "servers": {
    "github": { "enabled": true },
    "slack": { "enabled": false }
  },
  "immediate": true
}
```

## 关键模式

### Two-part Argument Hint

```
[enable|disable [server-name]]
// 操作 + 可选参数
// 清晰的使用指导
```

## 借用价值

- ⭐⭐⭐⭐ Immediate模式
- ⭐⭐⭐⭐ Argument hint格式
- ⭐⭐⭐ MCP服务器管理

## 来源

- Claude Code: `commands/mcp/index.ts`
- 分析报告: P36-9