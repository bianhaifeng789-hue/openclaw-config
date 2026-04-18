# Advisor Command Skill

顾问模型配置 - Feature-gated启用 + Model validation。

## 功能概述

从Claude Code的advisor.ts提取的顾问模型模式，用于OpenClaw的辅助模型配置。

## 核心机制

### 命令结构

```typescript
{
  type: 'local',
  name: 'advisor',
  description: 'Configure the advisor model',
  argumentHint: '[<model>|off]',
  isEnabled: () => canUserConfigureAdvisor(),
  get isHidden() {
    return !canUserConfigureAdvisor()
  },
  supportsNonInteractive: true,
  load: () => Promise.resolve({ call })
}
```

### Feature-gated Visibility

```typescript
isEnabled: () => canUserConfigureAdvisor()
isHidden: !canUserConfigureAdvisor()
// 只在用户有权限时显示
// getter动态计算
```

### Model Validation

```typescript
const { valid, error } = await validateModel(resolvedModel)
if (!valid) {
  return { type: 'text', value: `Invalid advisor model: ${error}` }
}

if (!isValidAdvisorModel(resolvedModel)) {
  return { type: 'text', value: `${arg} cannot be used as an advisor` }
}
```

### Base Model Check

```typescript
const baseModel = parseUserSpecifiedModel(context.getAppState().mainLoopModel)
if (!modelSupportsAdvisor(baseModel)) {
  return `Advisor set to ${model}. Note: Current model (${baseModel}) does not support advisors.`
}
// 主模型不支持advisor时提示
```

### Settings Update

```typescript
context.setAppState(s => ({ ...s, advisorModel: normalizedModel }))
updateSettingsForSource('userSettings', { advisorModel: normalizedModel })
// 同时更新state和settings
```

### unset/off处理

```typescript
if (arg === 'unset' || arg === 'off') {
  const prev = context.getAppState().advisorModel
  context.setAppState(s => ({ ...s, advisorModel: undefined }))
  updateSettingsForSource('userSettings', { advisorModel: undefined })
  return { type: 'text', value: `Advisor disabled (was ${prev}).` }
}
```

## 实现建议

### OpenClaw适配

1. **feature gate**: 条件显示命令
2. **validation**: 模型验证流程
3. **compatibility**: 检查主模型支持
4. **settings sync**: state + settings同时更新

### 状态文件示例

```json
{
  "advisorModel": "claude-opus-4-20250514",
  "baseModel": "claude-sonnet-4-20250514",
  "supportsAdvisor": true,
  "isEnabled": true
}
```

## 关键模式

### Dual Update

```typescript
context.setAppState(...)
updateSettingsForSource(...)
// state和settings同时更新
// 保证一致性
```

### Compatibility Check

```typescript
modelSupportsAdvisor(baseModel)
// 主模型支持检查
// 不支持时提示但允许设置
```

### Feature-gated isHidden

```typescript
get isHidden() { return !canUserConfigureAdvisor() }
// getter动态计算
// 无权限时隐藏
```

## 借用价值

- ⭐⭐⭐⭐ Feature-gated visibility
- ⭐⭐⭐⭐ Model validation流程
- ⭐⭐⭐⭐ Dual update（state + settings）
- ⭐⭐⭐⭐ Compatibility check

## 来源

- Claude Code: `commands/advisor.ts`
- 分析报告: P35-6