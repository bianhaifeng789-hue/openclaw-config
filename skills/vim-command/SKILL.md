# Vim Command Skill

Vim模式命令 - Type:local + NonInteractive禁用。

## 功能概述

从Claude Code的vim/index.ts提取的vim模式，用于OpenClaw的编辑模式切换。

## 核心机制

### 命令结构

```typescript
{
  name: 'vim',
  description: 'Toggle between Vim and Normal editing modes',
  supportsNonInteractive: false,
  type: 'local',
  load: () => import('./vim.js')
}
```

### NonInteractive禁用

```typescript
supportsNonInteractive: false
// Vim模式需要交互
// 非交互会话不可用
```

### Type: local

```typescript
type: 'local'
// 本地命令，不需要JSX渲染
// 简单的toggle逻辑
```

## 实现建议

### OpenClaw适配

1. **type**: local简单命令
2. **nonInteractive**: 禁用
3. **toggle**: Vim/Normal切换

### 状态文件示例

```json
{
  "mode": "vim",
  "supportsNonInteractive": false,
  "type": "local"
}
```

## 关键模式

### supportsNonInteractive: false

```
交互功能在非交互会话禁用
// Vim需要键盘交互
// headless模式不支持
```

## 借用价值

- ⭐⭐⭐ supportsNonInteractive控制
- ⭐⭐⭐ type: local简单命令

## 来源

- Claude Code: `commands/vim/index.ts`
- 分析报告: P36-8