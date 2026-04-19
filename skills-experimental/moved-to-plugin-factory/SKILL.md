# Moved To Plugin Command Factory Skill

Plugin迁移工厂 - USER_TYPE判断 + 双版本提示。

## 功能概述

从Claude Code的createMovedToPluginCommand.ts提取的plugin迁移模式，用于OpenClaw的命令迁移。

## 核心机制

### Factory Pattern

```typescript
export function createMovedToPluginCommand({
  name, description, progressMessage,
  pluginName, pluginCommand,
  getPromptWhileMarketplaceIsPrivate
}): Command
// 工厂函数创建迁移命令
```

### USER_TYPE判断

```typescript
if (process.env.USER_TYPE === 'ant') {
  return [{
    type: 'text',
    text: `This command moved to plugin.
    Install: claude plugin install ${pluginName}@claude-code-marketplace
    Use: /${pluginName}:${pluginCommand}`
  }]
}
// Ant用户看到安装提示
// 外部用户用fallback prompt
```

### Marketplace URL

```
https://github.com/anthropics/claude-code-marketplace/blob/main/${pluginName}/README.md
// 指向plugin README
```

## 实现建议

### OpenClaw适配

1. **factory**: 迁移命令工厂
2. **userType**: 内部/外部区分
3. **fallback**: Marketplace私有时的备用

### 状态文件示例

```json
{
  "migratedCommands": [
    { "name": "old-command", "plugin": "new-plugin", "pluginCommand": "new-cmd" }
  ]
}
```

## 关键模式

### Dual Prompt Strategy

```
Ant: "Moved to plugin, install..."
External: getPromptWhileMarketplaceIsPrivate()
// 根据用户类型显示不同内容
```

### Graceful Migration

```
不删除命令 → 提示迁移路径 → 引导安装plugin
// 用户友好迁移
```

## 借用价值

- ⭐⭐⭐⭐ Factory pattern
- ⭐⭐⭐⭐ USER_TYPE dual prompt
- ⭐⭐⭐ Migration strategy

## 来源

- Claude Code: `commands/createMovedToPluginCommand.ts`
- 分析报告: P37-4