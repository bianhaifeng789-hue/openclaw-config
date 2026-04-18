# Ask User Question Tool Skill

用户提问工具 - MultiSelect + Preview + Uniqueness validation + Chip width。

## 功能概述

从Claude Code的AskUserQuestionTool提取的交互式问答模式，用于OpenClaw的用户交互。

## 核心机制

### MultiSelect Support

```typescript
multiSelect: z.boolean().default(false).describe(
  'Set to true to allow selecting multiple options. Use when choices are not mutually exclusive.'
)
// 单选或多选
// 非互斥选项支持多选
```

### Preview Content

```typescript
preview: z.string().optional().describe(
  'Optional preview content rendered when this option is focused.
   Use for mockups, code snippets, or visual comparisons.'
)
// 选项focused时显示preview
// 代码片段、mockup等
```

### Uniqueness Validation

```typescript
const UNIQUENESS_REFINE = {
  check: (data) => {
    const questions = data.questions.map(q => q.question)
    if (questions.length !== new Set(questions).size) return false
    for (const question of data.questions) {
      const labels = question.options.map(opt => opt.label)
      if (labels.length !== new Set(labels).size) return false
    }
    return true
  }
}
// 问题必须unique
// 每个问题的选项label必须unique
```

### Chip Width Limit

```typescript
const ASK_USER_QUESTION_TOOL_CHIP_WIDTH = 15
header: z.string().describe(
  `Very short label as chip/tag (max ${CHIP_WIDTH} chars). Examples: "Auth method", "Library".`
)
// Header有长度限制
// 紧凑显示
```

### Option Limits

```typescript
options: z.array(questionOptionSchema()).min(2).max(4).describe(
  'The available choices. Must have 2-4 options.
   Each should be a distinct, mutually exclusive choice.'
)
// 2-4个选项
// 没有"Other"（自动提供）
```

### Annotations Schema

```typescript
annotations: z.record(z.string(), z.object({
  preview: z.string().optional(),
  notes: z.string().optional()
})).optional()
// Keyed by question text
// 用户可添加notes
```

## 实现建议

### OpenClaw适配

1. **multiSelect**: 多选支持
2. **preview**: 选项preview
3. **uniqueness**: 唯一性验证
4. **chipWidth**: Chip限制

### 状态文件示例

```json
{
  "question": "Which library?",
  "header": "Library",
  "multiSelect": false,
  "optionsCount": 3,
  "validated": true
}
```

## 关键模式

### Preview on Focus

```
Option focused → Preview rendered
// 视觉比较
// 更好决策
```

### Uniqueness Refine

```
z.refine → Set comparison → reject duplicates
// 问题唯一
// 选项label唯一
```

### Auto "Other"

```
No 'Other' in options → Auto-provided
// 用户可自定义
// 无需显式添加
```

## 借用价值

- ⭐⭐⭐⭐⭐ MultiSelect + Preview pattern
- ⭐⭐⭐⭐ Uniqueness validation
- ⭐⭐⭐⭐ Chip width limit
- ⭐⭐⭐ Option limits (2-4)

## 来源

- Claude Code: `tools/AskUserQuestionTool/AskUserQuestionTool.tsx` (10KB+)
- 分析报告: P38-16