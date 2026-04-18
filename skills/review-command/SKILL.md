# Review Command Skill

PR审查命令 - Local和Remote两种模式。

## 功能概述

从Claude Code的review.ts提取的PR审查模式，用于OpenClaw的代码审查。

## 核心机制

### 双模式

```typescript
// Local mode
const review: Command = {
  type: 'prompt',
  name: 'review',
  description: 'Review a pull request',
  progressMessage: 'reviewing pull request',
  contentLength: 0,
  source: 'builtin',
  async getPromptForCommand(args) { ... }
}

// Remote mode（CCR）
const ultrareview: Command = {
  type: 'local-jsx',
  name: 'ultrareview',
  description: '~10–20 min · Finds and verifies bugs...',
  isEnabled: () => isUltrareviewEnabled(),
  load: () => import('./review/ultrareviewCommand.js')
}
```

### Local Prompt

```typescript
const LOCAL_REVIEW_PROMPT = (args: string) => `
  1. If no PR number, run \`gh pr list\`
  2. If PR number provided, run \`gh pr view <number>\`
  3. Run \`gh pr diff <number>\`
  4. Analyze changes and provide thorough code review
`
```

### Review Focus

```
- Code correctness
- Following project conventions
- Performance implications
- Test coverage
- Security considerations
```

### Remote Mode（CCR）

- **ultrareview**: CCR远程执行
- **Duration**: ~10-20 min
- **Feature**: Finds AND verifies bugs
- **Terms URL**: Required legal disclosure

## 实现建议

### OpenClaw适配

1. **local mode**: prompt类型，getPromptForCommand
2. **remote mode**: local-jsx类型，subagent
3. **progress message**: 审查进度显示
4. **focus areas**: 定义审查重点

### 状态文件示例

```json
{
  "mode": "local",
  "prNumber": "123",
  "reviewFocus": ["correctness", "conventions", "performance", "security"],
  "durationMs": 180000
}
```

## 关键模式

### Dual Entry Point

```
/review → local prompt execution
/ultrareview → remote CCR execution
// 分离避免混淆
```

### Progress Message

```typescript
progressMessage: 'reviewing pull request'
// 用户可见进度指示
```

### Legal Disclosure

```typescript
description: "~10–20 min · ... See ${CCR_TERMS_URL} Use when [review command] is needed."
// Legal要求显示terms URL
```

## 借用价值

- ⭐⭐⭐⭐ Dual mode分离
- ⭐⭐⭐⭐ Progress message
- ⭐⭐⭐⭐ Review focus定义
- ⭐⭐⭐ Legal disclosure模式

## 来源

- Claude Code: `commands/review.ts`
- 分析报告: P35-3