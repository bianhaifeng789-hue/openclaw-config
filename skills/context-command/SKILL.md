# Context Command Skill

上下文可视化命令 - 双版本（Interactive + NonInteractive）。

## 功能概述

从Claude Code的context/index.ts提取的上下文可视化模式，用于OpenClaw的token使用显示。

## 核心机制

### 双命令结构

```typescript
// Interactive version
export const context: Command = {
  name: 'context',
  description: 'Visualize current context usage as a colored grid',
  isEnabled: () => !getIsNonInteractiveSession(),
  type: 'local-jsx',
  load: () => import('./context.js')
}

// NonInteractive version
export const contextNonInteractive: Command = {
  type: 'local',
  name: 'context',
  supportsNonInteractive: true,
  description: 'Show current context usage',
  get isHidden() { return !getIsNonInteractiveSession() },
  isEnabled() { return getIsNonInteractiveSession() },
  load: () => import('./context-noninteractive.js')
}
```

### 条件互补

```typescript
// Interactive: isEnabled when NOT non-interactive
// NonInteractive: isEnabled when non-interactive
// isHidden: opposite of isEnabled
// 只有一个显示，根据运行模式
```

### Visualization

```
colored grid - 彩色网格显示token使用
// Interactive版本有视觉化UI
// NonInteractive版本是纯文本
```

## 实现建议

### OpenClaw适配

1. **dual version**: Interactive + NonInteractive
2. **isEnabled**: 条件显示
3. **isHidden**: getter动态计算
4. **visualization**: 彩色网格

### 状态文件示例

```json
{
  "interactive": {
    "isEnabled": true,
    "isHidden": false,
    "type": "local-jsx"
  },
  "nonInteractive": {
    "isEnabled": false,
    "isHidden": true,
    "type": "local"
  }
}
```

## 关键模式

### Dual Export

```typescript
export const context: Command
export const contextNonInteractive: Command
// 两个版本同时导出
// 根据条件显示其中一个
```

### Complementary isEnabled

```
Interactive: !getIsNonInteractiveSession()
NonInteractive: getIsNonInteractiveSession()
// 互补条件
// 只显示一个
```

## 借用价值

- ⭐⭐⭐⭐ Dual version模式
- ⭐⭐⭐⭐ Complementary isEnabled
- ⭐⭐⭐ Colored grid visualization

## 来源

- Claude Code: `commands/context/index.ts`
- 分析报告: P36-4