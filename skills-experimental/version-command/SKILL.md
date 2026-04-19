# Version Command Skill

版本显示命令 - Ant-only + MACRO build time。

## 功能概述

从Claude Code的version.ts提取的版本模式，用于OpenClaw的版本显示。

## 核心机制

### Ant-only限制

```typescript
isEnabled: () => process.env.USER_TYPE === 'ant'
// 只有内部用户可用
// 生产环境不显示
```

### MACRO注入

```typescript
MACRO.VERSION  // Build时注入版本号
MACRO.BUILD_TIME  // Build时注入时间
// Bun bundle macros
```

### Session Running

```typescript
description: "'Print the version this session is running Use when [version command] is needed."
              (not what autoupdate downloaded)'
// 显示当前session运行版本
// 不是autoupdate下载的版本
```

## 实现建议

### OpenClaw适配

1. **ant-only**: 内部调试命令
2. **macro**: Build注入版本
3. **session**: 当前运行版本

### 状态文件示例

```json
{
  "version": "1.0.34",
  "buildTime": "2026-04-12T10:00:00Z",
  "userType": "ant"
}
```

## 关键模式

### MACRO Pattern

```
Build时注入常量
// Bun bundle macros
// 避免硬编码版本
```

## 借用价值

- ⭐⭐⭐ MACRO injection
- ⭐⭐⭐ Ant-only限制

## 来源

- Claude Code: `commands/version.ts`
- 分析报告: P37-7