# Effort Command Skill

Effort配置命令 - Getter immediate + Argument hint。

## 功能概述

从Claude Code的effort/index.ts提取的effort模式，用于OpenClaw的模型effort设置。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'effort',
  description: 'Set effort level for model usage',
  argumentHint: '[low|medium|high|max|auto]',
  get immediate() {
    return shouldInferenceConfigCommandBeImmediate()
  },
  load: () => import('./effort.js')
}
```

### Effort Levels

```
low | medium | high | max | auto
// 控制模型努力程度
// 影响thinking budget
```

### Getter Immediate

```typescript
get immediate() {
  return shouldInferenceConfigCommandBeImmediate()
}
// 基于运行模式决定
// 非阻塞模式immediate
```

## 实现建议

### OpenClaw适配

1. **levels**: 定义effort等级
2. **immediate**: getter动态计算
3. **argumentHint**: 显示可选值

### 状态文件示例

```json
{
  "levels": ["low", "medium", "high", "max", "auto"],
  "current": "medium",
  "immediate": true
}
```

## 关键模式

### Argument Hint Format

```
[low|medium|high|max|auto]
// 显示所有可选值
// 用户一目了然
```

## 借用价值

- ⭐⭐⭐ Argument hint格式
- ⭐⭐⭐ Getter immediate

## 来源

- Claude Code: `commands/effort/index.ts`
- 分析报告: P36-6