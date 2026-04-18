# Config Command Skill

配置命令 - Alias别名 + 面板打开。

## 功能概述

从Claude Code的config/index.ts提取的配置模式，用于OpenClaw的设置管理。

## 核心机制

### 命令结构

```typescript
{
  aliases: ['settings'],
  type: 'local-jsx',
  name: 'config',
  description: 'Open config panel',
  load: () => import('./config.js')
}
```

### Alias Support

```typescript
aliases: ['settings']
// 用户可以用/config或/settings
// 提升discoverability
```

### Panel Opening

```typescript
type: 'local-jsx'
// React组件渲染配置面板
// load按需加载
```

## 实现建议

### OpenClaw适配

1. **alias**: 提供alternative名称
2. **panel**: React配置面板
3. **load**: 按需加载实现

### 状态文件示例

```json
{
  "aliases": ["settings"],
  "description": "Open config panel",
  "type": "local-jsx"
}
```

## 关键模式

### Alias Naming

```
aliases: ['settings']
// 不同用户习惯不同名称
// 提升命令可用性
```

## 借用价值

- ⭐⭐⭐ Alias提升可用性
- ⭐⭐⭐ Panel组件模式

## 来源

- Claude Code: `commands/config/index.ts`
- 分析报告: P36-1