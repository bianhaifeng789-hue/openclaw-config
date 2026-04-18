# Config Tool Skill

配置工具 - Kill switch + Kill switch validation + AppState sync。

## 功能概述

从Claude Code的ConfigTool提取的配置管理模式，用于OpenClaw的设置管理。

## 核心机制

### Kill Switch Check

```typescript
if (feature('VOICE_MODE') && setting === 'voiceEnabled') {
  const { isVoiceGrowthBookEnabled } = await import('...')
  if (!isVoiceGrowthBookEnabled()) {
    return { success: false, error: 'Unknown setting' }
  }
}
// Runtime gate检查
// Kill switch关时不暴露设置
```

### Coerce Boolean

```typescript
if (config.type === 'boolean') {
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    if (lower === 'true') finalValue = true
    else if (lower === 'false') finalValue = false
  }
}
// String → Boolean coercion
// 用户友好输入
```

### Validate On Write

```typescript
if (config.validateOnWrite) {
  const result = await config.validateOnWrite(finalValue)
  if (!result.valid) {
    return { success: false, error: result.error }
  }
}
// 异步验证（如model API check）
// 写入前校验
```

### AppState Sync

```typescript
if (config.appStateKey) {
  context.setAppState(prev => {
    if (prev[appKey] === finalValue) return prev
    return { ...prev, [appKey]: finalValue }
  })
}
// 配置变更同步到AppState
// 立即UI响应
```

### Default Resolution

```typescript
if (value.toLowerCase().trim() === 'default') {
  saveGlobalConfig(prev => {
    delete prev.remoteControlAtStartup
    return prev
  })
  const resolved = getRemoteControlAtStartup()  // Platform-aware default
}
// 'default' → unset → resolve default
// 支持平台感知默认值
```

### Pre-flight Checks

```typescript
// Voice mode: multi-layer checks
const recording = await checkRecordingAvailability()
const deps = await checkVoiceDependencies()
const mic = await requestMicrophonePermission()
// 多层pre-flight validation
// 环境依赖检查
```

## 实现建议

### OpenClaw适配

1. **killSwitch**: Runtime gate
2. **coerce**: Type coercion
3. **validate**: Async validation
4. **sync**: AppState sync
5. **default**: Platform-aware defaults

### 状态文件示例

```json
{
  "setting": "voiceEnabled",
  "operation": "set",
  "previousValue": false,
  "newValue": true,
  "appStateSynced": true,
  "validationPassed": true
}
```

## 关键模式

### Kill Switch Pattern

```
feature gate → runtime check → deny if disabled
// 双层gate（build-time + runtime）
// 保护sensitive设置
```

### Multi-layer Validation

```
Coerce → Options → ValidateOnWrite → Pre-flight
// 层层验证
// 失败返回详细error
```

### AppState Immediate Sync

```
Config write → setAppState → UI react
// 无延迟响应
// 避免stale state
```

## 借用价值

- ⭐⭐⭐⭐⭐ Kill switch validation
- ⭐⭐⭐⭐⭐ Multi-layer validation
- ⭐⭐⭐⭐⭐ AppState sync
- ⭐⭐⭐⭐ Default resolution
- ⭐⭐⭐⭐ Pre-flight checks

## 来源

- Claude Code: `tools/ConfigTool/ConfigTool.ts` (8KB)
- 分析报告: P38-7