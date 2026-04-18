# Permissions Command Skill

权限管理命令 - Alias别名 + 工具规则管理。

## 功能概述

从Claude Code的permissions/index.ts提取的权限管理模式，用于OpenClaw的工具权限配置。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'permissions',
  aliases: ['allowed-tools'],
  description: 'Manage allow & deny tool permission rules',
  load: () => import('./permissions.js')
}
```

### Alias Support

```typescript
aliases: ['allowed-tools']
// 权限管理也可以叫allowed-tools
// 更直观的名称
```

### Permission Rules

```
Allow & Deny rules for tools
// Bash(git:*): allow
// Bash(rm:*): deny
// 格式: Tool(pattern)
```

## 实现建议

### OpenClaw适配

1. **alias**: allowed-tools别名
2. **rules**: allow/deny规则管理
3. **panel**: React管理面板

### 状态文件示例

```json
{
  "aliases": ["allowed-tools"],
  "rules": {
    "allow": ["Bash(git:*)", "Read", "Edit"],
    "deny": ["Bash(rm:*)"]
  }
}
```

## 关键模式

### Descriptive Alias

```
aliases: ['allowed-tools']
// permissions是抽象概念
// allowed-tools更具体
```

## 借用价值

- ⭐⭐⭐ Alias提升直观性
- ⭐⭐⭐ Permission rules管理

## 来源

- Claude Code: `commands/permissions/index.ts`
- 分析报告: P36-5