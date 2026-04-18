---
name: cron-expression-parser
description: |
  Parse and evaluate 5-field cron expressions. Compute next run time, validate expressions, convert to human-readable format.
  
  Use when:
  - Creating or validating cron scheduled tasks
  - Computing next fire time for a cron expression
  - Converting cron to human-readable description
  - Checking if a cron task should fire now
  
  Keywords: cron, schedule, next run, cron expression, parse cron, cron validation
metadata:
  openclaw:
    emoji: "🕐"
    source: claude-code-cron-parser
    triggers: [cron-expression, schedule-parse, next-run-time]
    priority: P1
---

# Cron Expression Parser

基于 Claude Code `utils/cron.ts` 的 5 字段 cron 表达式解析器。

## 支持的语法

```
格式: M H DoM Mon DoW
字段: minute(0-59) hour(0-23) day-of-month(1-31) month(1-12) day-of-week(0-6, 0=Sunday)

支持:
  *         → 所有值
  N         → 具体值（如 5）
  */N       → 步长（如 */5 = 每5个）
  N-M       → 范围（如 9-17）
  N-M/S     → 范围+步长（如 0-30/5）
  N,M,...   → 列表（如 1,3,5）

不支持: L, W, ?, 月份/星期名称别名
时区: 进程本地时区
```

## 核心函数（来自 Claude Code）

### parseCronExpression(expr)
```javascript
function parseCronExpression(expr) {
  const fields = expr.trim().split(/\s+/)
  if (fields.length !== 5) return null
  
  const ranges = [
    { min: 0, max: 59 },  // minute
    { min: 0, max: 23 },  // hour
    { min: 1, max: 31 },  // day-of-month
    { min: 1, max: 12 },  // month
    { min: 0, max: 6 },   // day-of-week (0=Sunday, 7=Sunday alias)
  ]
  
  const parsed = fields.map((f, i) => expandField(f, ranges[i]))
  if (parsed.some(f => f === null)) return null
  
  return {
    minute: parsed[0],
    hour: parsed[1],
    dayOfMonth: parsed[2],
    month: parsed[3],
    dayOfWeek: parsed[4],
  }
}
```

### computeNextCronRun(expr, fromMs)
```javascript
// 从 fromMs 开始，找下一个匹配时间（精确到分钟）
function computeNextCronRun(expr, fromMs = Date.now()) {
  const fields = parseCronExpression(expr)
  if (!fields) return null
  
  // 从下一分钟开始搜索（不含当前分钟）
  let t = new Date(fromMs)
  t.setSeconds(0, 0)
  t.setMinutes(t.getMinutes() + 1)
  
  // 最多搜索 4 年（避免无限循环）
  const limit = new Date(fromMs)
  limit.setFullYear(limit.getFullYear() + 4)
  
  while (t < limit) {
    if (
      fields.month.includes(t.getMonth() + 1) &&
      fields.dayOfMonth.includes(t.getDate()) &&
      fields.dayOfWeek.includes(t.getDay()) &&
      fields.hour.includes(t.getHours()) &&
      fields.minute.includes(t.getMinutes())
    ) {
      return t.getTime()
    }
    t.setMinutes(t.getMinutes() + 1)
  }
  return null
}
```

### cronToHuman(expr)
```javascript
// 转换为人类可读描述
function cronToHuman(expr) {
  const examples = {
    '* * * * *':     '每分钟',
    '*/5 * * * *':   '每 5 分钟',
    '0 * * * *':     '每小时整点',
    '0 9 * * *':     '每天 09:00',
    '0 9 * * 1-5':   '工作日 09:00',
    '0 9 * * 1':     '每周一 09:00',
    '0 0 1 * *':     '每月 1 日 00:00',
  }
  return examples[expr] ?? `cron: ${expr}`
}
```

## 使用示例

```javascript
// 验证并计算下次触发
const expr = '0 9 * * 1-5'
const fields = parseCronExpression(expr)
// → { minute: [0], hour: [9], dayOfMonth: [1..31], month: [1..12], dayOfWeek: [1,2,3,4,5] }

const nextRun = computeNextCronRun(expr, Date.now())
// → 下个工作日 09:00 的时间戳

const human = cronToHuman(expr)
// → "工作日 09:00"
```

## 常用 Cron 表达式

| 表达式 | 含义 |
|--------|------|
| `* * * * *` | 每分钟 |
| `*/5 * * * *` | 每 5 分钟 |
| `0 * * * *` | 每小时 |
| `0 9 * * *` | 每天 9 点 |
| `0 9 * * 1-5` | 工作日 9 点 |
| `0 9 * * 1` | 每周一 9 点 |
| `0 0 1 * *` | 每月 1 日 |
| `30 14 28 2 *` | 2 月 28 日 14:30（一次性用） |
