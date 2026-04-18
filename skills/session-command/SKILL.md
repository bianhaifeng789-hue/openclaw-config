# Session Command Skill

远程会话显示命令 - QR码和URL展示。

## 功能概述

从Claude Code的session/index.ts提取的远程会话模式，用于OpenClaw的远程控制。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'session',
  aliases: ['remote'],
  description: 'Show remote session URL and QR code',
  isEnabled: () => getIsRemoteMode(),
  get isHidden() {
    return !getIsRemoteMode()
  },
  load: () => import('./session.js')
}
```

### 条件显示

```typescript
isEnabled: () => getIsRemoteMode()
isHidden: !getIsRemoteMode()
// 只在远程模式显示
// 非远程模式隐藏
```

### 动态isHidden

```typescript
get isHidden() {
  return !getIsRemoteMode()
}
// getter确保状态变化时更新
```

## 实现建议

### OpenClaw适配

1. **场景**: 移动端远程控制
2. **显示**: QR码 + URL
3. **条件**: 只在特定模式启用
4. **alias**: 提供alternative名称

### 状态文件示例

```json
{
  "remoteSessionUrl": "https://...",
  "qrCode": "base64...",
  "isRemoteMode": true
}
```

## 关键模式

### Conditional Command

命令可用性基于运行状态：
- `isEnabled`: 功能开关
- `isHidden`: UI显示控制
- `get`: 动态计算

### Alias Support

```typescript
aliases: ['remote']
// 用户可选择不同名称
// 提升discoverability
```

## 借用价值

- ⭐⭐⭐ Conditional visibility模式
- ⭐⭐⭐ Dynamic getter计算
- ⭐⭐⭐ Alias提升可用性

## 来源

- Claude Code: `commands/session/index.ts`
- 分析报告: P34-5