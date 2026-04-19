# Voice Command Skill

语音模式命令 - Availability限制 + Feature双gate。

## 功能概述

从Claude Code的voice/index.ts提取的语音模式，用于OpenClaw的语音交互。

## 核心机制

### 命令结构

```typescript
{
  type: 'local',
  name: 'voice',
  description: 'Toggle voice mode',
  availability: ['claude-ai'],
  isEnabled: () => isVoiceGrowthBookEnabled(),
  get isHidden() { return !isVoiceModeEnabled() },
  supportsNonInteractive: false,
  load: () => import('./voice.js')
}
```

### Availability限制

```typescript
availability: ['claude-ai']
// 只在claude-ai surface可用
// 其他平台不显示
```

### Feature双gate

```typescript
isEnabled: () => isVoiceGrowthBookEnabled()  // GrowthBook
isHidden: !isVoiceModeEnabled()              // Runtime
// 两层条件检查
```

### NonInteractive禁用

```typescript
supportsNonInteractive: false
// 语音需要音频交互
// headless不支持
```

## 实现建议

### OpenClaw适配

1. **availability**: surface限制
2. **featureGate**: 双层gate
3. **nonInteractive**: 禁用

### 状态文件示例

```json
{
  "availability": ["claude-ai"],
  "growthBookEnabled": true,
  "modeEnabled": true,
  "supportsNonInteractive": false
}
```

## 关键模式

### Double Feature Gate

```typescript
isEnabled: isVoiceGrowthBookEnabled()   // Feature flag
isHidden: !isVoiceModeEnabled()         // Runtime state
// GrowthBook决定功能存在
// Runtime决定当前是否启用
```

## 借用价值

- ⭐⭐⭐⭐ Double feature gate
- ⭐⭐⭐⭐ Availability限制
- ⭐⭐⭐ supportsNonInteractive控制

## 来源

- Claude Code: `commands/voice/index.ts`
- 分析报告: P36-11