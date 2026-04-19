# Cron Create Tool Skill

Cron任务创建 - Recurring/One-shot + Durable persistence + Validation。

## 功能概述

从Claude Code的CronCreateTool提取的cron调度模式，用于OpenClaw的定时任务。

## 核心机制

### Input Schema

```typescript
z.strictObject({
  cron: z.string().describe('Standard 5-field: "M H DoM Mon DoW"'),
  prompt: z.string().describe('The prompt to enqueue'),
  recurring: semanticBoolean().describe('true=fire every match, false=once'),
  durable: semanticBoolean().describe('true=persist to disk, false=in-memory')
})
```

### Cron Validation

```typescript
if (!parseCronExpression(input.cron)) {
  return { result: false, message: 'Invalid cron expression', errorCode: 1 }
}

if (nextCronRunMs(input.cron, Date.now()) === null) {
  return { result: false, message: 'Does not match any date in next year', errorCode: 2 }
}
// 两个验证：格式 + 可执行时间
```

### Limits

```typescript
const MAX_JOBS = 50

if (tasks.length >= MAX_JOBS) {
  return { result: false, message: 'Too many jobs (max 50)', errorCode: 3 }
}
// 系统限制50个任务
```

### Durable Constraints

```typescript
if (input.durable && getTeammateContext()) {
  return { result: false, message: 'durable crons not supported for teammates', errorCode: 4 }
}
// Teammate不支持durable
// 不跨session持久化
```

### Kill Switch

```typescript
const effectiveDurable = durable && isDurableCronEnabled()
// Gate可以flip mid-session
// 强制降级到session-only
```

### Enable Scheduler

```typescript
setScheduledTasksEnabled(true)
// 创建后启用scheduler
// Hook开始polling
```

## 实现建议

### OpenClaw适配

1. **schema**: Cron + prompt + flags
2. **validation**: 格式+时间+限制
3. **durable**: 持久化支持
4. **enable**: Scheduler启动

### 状态文件示例

```json
{
  "id": "cron_abc123",
  "humanSchedule": "Every 5 minutes",
  "recurring": true,
  "durable": true
}
```

## 关键模式

### Dual Validation

```
parseCronExpression → format check
nextCronRunMs → schedule viability
// 两个层面验证
```

### Kill Switch Pattern

```typescript
durable && isDurableCronEnabled()
// Gate flip mid-session
// Schema稳定，模型无感知
```

### Human-readable Schedule

```typescript
cronToHuman(cron)
// "*/5 * * * *" → "Every 5 minutes"
// 用户友好显示
```

## 借用价值

- ⭐⭐⭐⭐⭐ Dual validation pattern
- ⭐⭐⭐⭐⭐ Kill switch pattern
- ⭐⭐⭐⭐ Human-readable schedule
- ⭐⭐⭐⭐ Durable constraints
- ⭐⭐⭐ Limits + enable flow

## 来源

- Claude Code: `tools/ScheduleCronTool/CronCreateTool.ts`
- 分析报告: P38-4