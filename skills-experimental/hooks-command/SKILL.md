# Hooks Command Skill

Hooks配置命令 - Immediate模式查看配置。

## 功能概述

从Claude Code的hooks/index.ts提取的hooks查看模式，用于OpenClaw的事件钩子管理。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'hooks',
  description: 'View hook configurations for tool events',
  immediate: true,
  load: () => import('./hooks.js')
}
```

### Immediate Execution

```typescript
immediate: true
// 立即执行，不等待turn end
// 查看配置不需要延迟
```

### Tool Events

```
PostToolUse, PreToolUse等事件
// Deterministic shell commands on tool events
```

## 实现建议

### OpenClaw适配

1. **immediate**: 配置查看立即执行
2. **events**: 定义tool events
3. **load**: 按需加载

### 状态文件示例

```json
{
  "immediate": true,
  "events": ["PostToolUse", "PreToolUse"],
  "description": "View hook configurations"
}
```

## 关键模式

### Immediate for Config

```
immediate: true
// 配置查看不需要延迟
// 快响应用户需求
```

## 借用价值

- ⭐⭐⭐ Immediate模式
- ⭐⭐⭐ Tool events定义

## 来源

- Claude Code: `commands/hooks/index.ts`
- 分析报告: P36-2