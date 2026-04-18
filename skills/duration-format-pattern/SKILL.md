# Duration Format Pattern Skill

Duration Format Pattern - formatDuration + ms threshold branches + <60s formatSeconds + rounding carry-over + 60s→minutes++ + 24h→days++ + hideTrailingZeros + mostSignificantOnly + days/hours/minutes/seconds cascade + formatSecondsShort decimal + formatNumber Intl.NumberFormat compact + cached formatter。

## 功能概述

从Claude Code的utils/format.ts提取的Duration format模式，用于OpenClaw的时长格式化。

## 核心机制

### formatDuration

```typescript
export function formatDuration(
  ms: number,
  options?: { hideTrailingZeros?: boolean; mostSignificantOnly?: boolean },
): string {
  if (ms < 60000) {
    // < 60 seconds
    if (ms === 0) return '0s'
    if (ms < 1) return `${(ms / 1000).toFixed(1)}s`
    const s = Math.floor(ms / 1000).toString()
    return `${s}s`
  }

  let days = Math.floor(ms / 86400000)
  let hours = Math.floor((ms % 86400000) / 3600000)
  let minutes = Math.floor((ms % 3600000) / 60000)
  let seconds = Math.round((ms % 60000) / 1000)

  // Handle rounding carry-over
  if (seconds === 60) { seconds = 0; minutes++ }
  if (minutes === 60) { minutes = 0; hours++ }
  if (hours === 24) { hours = 0; days++ }

  // ...
}
// Format milliseconds to human-readable duration
# Days, hours, minutes, seconds
```

### ms Threshold Branches

```typescript
if (ms < 60000) {
  // < 60s: simple seconds format
}
// >= 60s: days/hours/minutes/seconds
// Threshold-based branching
```

### <60s formatSeconds

```typescript
if (ms < 60000) {
  if (ms === 0) return '0s'
  if (ms < 1) return `${(ms / 1000).toFixed(1)}s`  // < 1ms: 0.5s
  const s = Math.floor(ms / 1000).toString()
  return `${s}s`
}
// < 60 seconds: simple format
# 0 → '0s'
# <1ms → decimal (0.5s)
# >=1ms → integer (5s)
```

### Rounding Carry-Over

```typescript
// Handle rounding carry-over (e.g., 59.5s rounds to 60s)
if (seconds === 60) {
  seconds = 0
  minutes++
}
if (minutes === 60) {
  minutes = 0
  hours++
}
if (hours === 24) {
  hours = 0
  days++
}
// Rounding carry-over
# Math.round((ms % 60000) / 1000) → 59.5s → 60s
# 60s → 0s, minutes++
# Cascade carry-over
```

### 60s→minutes++

```typescript
if (seconds === 60) {
  seconds = 0
  minutes++
}
// 60 seconds → increment minutes
# Carry-over logic
```

### 24h→days++

```typescript
if (hours === 24) {
  hours = 0
  days++
}
// 24 hours → increment days
# Cascade carry-over
```

### hideTrailingZeros

```typescript
const hide = options?.hideTrailingZeros

if (days > 0) {
  if (hide && hours === 0 && minutes === 0) return `${days}d`
  if (hide && minutes === 0) return `${days}d ${hours}h`
  return `${days}d ${hours}h ${minutes}m`
}
// Hide trailing zeros
# days with zero hours/minutes → just 'Xd'
# Cascade hiding
```

### mostSignificantOnly

```typescript
if (options?.mostSignificantOnly) {
  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}
// Most significant unit only
# Only show largest non-zero unit
```

### days/hours/minutes/seconds Cascade

```typescript
// Cascade from largest to smallest
days → hours → minutes → seconds
// Check each threshold
# Days first
# Hours if no days
# Minutes if no hours
# Seconds if no minutes
```

### formatSecondsShort decimal

```typescript
export function formatSecondsShort(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}
// Always 1 decimal place
# 1234 → "1.2s"
# TTFT, hook durations
# Sub-minute timings
```

### formatNumber Intl.NumberFormat compact

```typescript
export function formatNumber(number: number): string {
  const shouldUseConsistentDecimals = number >= 1000

  return getNumberFormatter(shouldUseConsistentDecimals)
    .format(number)  // 1321 → "1.3K"
    .toLowerCase()   // "1.3K" → "1.3k"
}
// Compact notation: 1321 → "1.3k"
# Intl.NumberFormat compact
# maximumFractionDigits: 1
```

### cached formatter

```typescript
let numberFormatterForConsistentDecimals: Intl.NumberFormat | null = null
let numberFormatterForInconsistentDecimals: Intl.NumberFormat | null = null

const getNumberFormatter = (useConsistentDecimals: boolean): Intl.NumberFormat => {
  if (useConsistentDecimals) {
    if (!numberFormatterForConsistentDecimals) {
      numberFormatterForConsistentDecimals = new Intl.NumberFormat(...)
    }
    return numberFormatterForConsistentDecimals
  } else {
    // ...
  }
}
// Cache Intl.NumberFormat
# new Intl.NumberFormat is expensive
# Cache for reuse
# Two formatters: consistent vs inconsistent decimals
```

## 实现建议

### OpenClaw适配

1. **durationFormat**: formatDuration pattern
2. **roundingCarryOver**: Rounding carry-over pattern
3. **hideTrailingZeros**: hideTrailingZeros pattern
4. **formatNumberCompact**: Intl.NumberFormat compact + cached pattern
5. **formatSecondsShort**: formatSecondsShort decimal pattern

### 状态文件示例

```json
{
  "ms": 123456789,
  "duration": "1d 10h 17m",
  "mostSignificantOnly": "1d"
}
```

## 关键模式

### Rounding Carry-Over Cascade

```
Math.round → 60s → seconds=0, minutes++ → minutes=60 → minutes=0, hours++ → cascade
# rounding carry-over cascade
# 59.5s → 60s → carry-over
# cascade handling
```

### hideTrailingZeros Logic

```
hide && hours===0 && minutes===0 → 'Xd' | hide && minutes===0 → 'Xd Xh' → hide trailing zeros
# hide trailing zeros logic
# 隐藏末尾的0值units
# cascade hiding
```

### mostSignificantOnly Return

```
days>0 → 'Xd' | hours>0 → 'Xh' | minutes>0 → 'Xm' → seconds → most significant only
# most significant only
# 只显示最大非零unit
# 单一unit
```

### Cached Intl.NumberFormat

```
new Intl.NumberFormat expensive → cache formatter → reuse → consistent/inconsistent decimals → two caches
# Intl.NumberFormat expensive
# cache formatter
# two caches (consistent vs inconsistent)
```

### formatSecondsShort Always Decimal

```
(ms/1000).toFixed(1) → always 1 decimal → '1.2s' → sub-minute → TTFT/hook durations
# always 1 decimal place
# sub-minute timings
# fractional second meaningful
```

## 借用价值

- ⭐⭐⭐⭐⭐ Rounding carry-over cascade pattern
- ⭐⭐⭐⭐⭐ hideTrailingZeros logic pattern
- ⭐⭐⭐⭐⭐ mostSignificantOnly pattern
- ⭐⭐⭐⭐⭐ Cached Intl.NumberFormat pattern
- ⭐⭐⭐⭐⭐ formatSecondsShort decimal pattern

## 来源

- Claude Code: `utils/format.ts` (308 lines)
- 分析报告: P55-4