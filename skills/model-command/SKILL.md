# Model Command Skill

模型配置命令 - Getter动态description + Immediate模式。

## 功能概述

从Claude Code的model/index.ts提取的模型配置模式，用于OpenClaw的模型选择。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'model',
  get description() {
    return `Set the AI model for Claude Code (currently ${renderModelName(getMainLoopModel())})`
  },
  argumentHint: '[model]',
  get immediate() {
    return shouldInferenceConfigCommandBeImmediate()
  },
  load: () => import('./model.js')
}
```

### Getter动态description

```typescript
get description() {
  return `... (currently ${renderModelName(getMainLoopModel())})`
}
// 动态显示当前模型
// 每次访问都是最新状态
```

### Getter动态immediate

```typescript
get immediate() {
  return shouldInferenceConfigCommandBeImmediate()
}
// 基于配置决定是否立即执行
// 非阻塞模式下immediate=true
```

### renderModelName

```typescript
renderModelName(getMainLoopModel())
// 格式化模型名称显示
// 用户友好的名称
```

## 实现建议

### OpenClaw适配

1. **getter**: 动态description和immediate
2. **argumentHint**: 模型参数提示
3. **load**: 按需加载实现
4. **current display**: 显示当前配置

### 状态文件示例

```json
{
  "currentModel": "claude-sonnet-4-20250514",
  "description": "Set the AI model (currently Sonnet 4)",
  "immediate": true
}
```

## 关键模式

### Getter Pattern

```typescript
get description() { return dynamicValue }
get immediate() { return dynamicCheck }
// 每次访问计算最新值
// 无需手动更新
```

### Current State Display

```typescript
(currently ${renderModelName(...)})
// description中显示当前状态
// 用户一眼看到配置
```

### Conditional Immediate

```typescript
shouldInferenceConfigCommandBeImmediate()
// 根据运行模式决定
// 非阻塞模式immediate
```

## 借用价值

- ⭐⭐⭐⭐ Getter动态description
- ⭐⭐⭐⭐ Current state display
- ⭐⭐⭐⭐ Conditional immediate
- ⭐⭐⭐ 模型名称格式化

## 来源

- Claude Code: `commands/model/index.ts`
- 分析报告: P35-5