# Brief Mode Command Skill

Brief模式命令 - Entitlement check + UserMsgOptIn同步 + MetaMessages。

## 功能概述

从Claude Code的brief.ts提取的brief模式，用于OpenClaw的精简输出控制。

## 核心机制

### 双Gate控制

```typescript
isEnabled: () => {
  if (feature('KAIROS') || feature('KAIROS_BRIEF')) {
    return getBriefConfig().enable_slash_command
  }
  return false
}
// Feature flag + GrowthBook config双层控制
```

### Entitlement Check

```typescript
// on-transition需要entitlement
if (newState && !isBriefEntitled()) {
  logEvent('tengu_brief_mode_toggled', { enabled: false, gated: true })
  onDone('Brief tool is not enabled for your account')
  return null
}
// off-transition总是允许
// 防止用户卡住
```

### UserMsgOptIn同步

```typescript
setUserMsgOptIn(newState)
// userMsgOptIn tracks isBriefOnly
// 保证tool available exactly when mode on
```

### MetaMessages注入

```typescript
const metaMessages = [
  `<system-reminder>
    Brief mode enabled. Use BriefTool for output.
  </system-reminder>`
]
// 明确的transition信号
// 避免model inertia
```

## 实现建议

### OpenClaw适配

1. **dualGate**: Feature + GB config
2. **entitlement**: 启用检查
3. **sync**: State + OptIn同步
4. **metaMessages**: 明确提示

### 状态文件示例

```json
{
  "isBriefOnly": true,
  "userMsgOptIn": true,
  "entitled": true,
  "kairos": false
}
```

## 关键模式

### Gated Transition

```
on: check entitlement
off: always allow
// 防止gate flip mid-session卡住用户
```

### Tool-State Synchronization

```typescript
setUserMsgOptIn(newState)  // Tool availability
setAppState({ isBriefOnly: newState })  // Mode state
// 两者同步避免tool list stale
```

### MetaMessages for Clarity

```
<system-reminder> transition message
// 明确告知mode变化
// 避免模型继续用旧方式
```

## 借用价值

- ⭐⭐⭐⭐⭐ Entitlement check pattern
- ⭐⭐⭐⭐⭐ Tool-state synchronization
- ⭐⭐⭐⭐⭐ MetaMessages injection
- ⭐⭐⭐⭐ Dual gate control

## 来源

- Claude Code: `commands/brief.ts`
- 分析报告: P37-2