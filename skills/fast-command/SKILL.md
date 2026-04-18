# Fast Command Skill

快速模式命令 - Feature-gated + Availability限制。

## 功能概述

从Claude Code的fast/index.ts提取的快速模式，用于OpenClaw的轻量模型切换。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'fast',
  get description() {
    return `Toggle fast mode (${FAST_MODE_MODEL_DISPLAY} only)`
  },
  availability: ['claude-ai', 'console'],
  isEnabled: () => isFastModeEnabled(),
  get isHidden() { return !isFastModeEnabled() },
  argumentHint: '[on|off]',
  get immediate() { return shouldInferenceConfigCommandBeImmediate() },
  load: () => import('./fast.js')
}
```

### Availability限制

```typescript
availability: ['claude-ai', 'console']
// 只在这些surface可用
// 其他平台不显示
```

### Feature-gated

```typescript
isEnabled: () => isFastModeEnabled()
isHidden: !isFastModeEnabled()
// GrowthBook feature控制
// 无权限时隐藏
```

### Dynamic Description

```typescript
get description() {
  return `Toggle fast mode (${FAST_MODE_MODEL_DISPLAY} only)`
}
// 显示当前快速模型名称
```

## 实现建议

### OpenClaw适配

1. **availability**: surface限制
2. **featureGate**: 条件启用
3. **dynamicDesc**: 显示当前配置

### 状态文件示例

```json
{
  "availability": ["claude-ai", "console"],
  "isEnabled": true,
  "isHidden": false,
  "fastModel": "Haiku 3.5"
}
```

## 关键模式

### Availability Array

```
availability: ['claude-ai', 'console']
// 平台限制
// 不是所有surface都可用
```

### Triple Gate

```
isEnabled: feature check
isHidden: !feature
availability: surface check
// 多层条件控制
```

## 借用价值

- ⭐⭐⭐⭐ Availability限制模式
- ⭐⭐⭐⭐ Triple gate控制
- ⭐⭐⭐ Dynamic description

## 来源

- Claude Code: `commands/fast/index.ts`
- 分析报告: P36-7