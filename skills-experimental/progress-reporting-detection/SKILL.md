# Progress Reporting Detection Skill

Progress Reporting Detection - isProgressReportingAvailable function + TTY check + WT_SESSION exclude + ConEmu detection + TERM_PROGRAM_VERSION coerce + Ghostty version check + iTerm2 version check + semver gte comparison + terminal feature detection。

## 功能概述

从Claude Code的ink/terminal.ts提取的Progress reporting检测模式，用于OpenClaw的终端特性检测。

## 核心机制

### isProgressReportingAvailable Function

```typescript
export function isProgressReportingAvailable(): boolean {
  // Only available if we have a TTY (not piped)
  if (!process.stdout.isTTY) {
    return false
  }

  // Explicitly exclude Windows Terminal
  if (process.env.WT_SESSION) {
    return false
  }

  // ConEmu supports OSC 9;4 for progress (all versions)
  if (process.env.ConEmuANSI || process.env.ConEmuPID || process.env.ConEmuTask) {
    return true
  }

  const version = coerce(process.env.TERM_PROGRAM_VERSION)
  if (!version) {
    return false
  }

  // Ghostty 1.2.0+ supports OSC 9;4
  if (process.env.TERM_PROGRAM === 'ghostty') {
    return gte(version.version, '1.2.0')
  }

  // iTerm2 3.6.6+ supports OSC 9;4
  if (process.env.TERM_PROGRAM === 'iTerm.app') {
    return gte(version.version, '3.6.6')
  }

  return false
}
// Check if terminal supports OSC 9;4 progress reporting
```

### TTY Check

```typescript
if (!process.stdout.isTTY) {
  return false
}
// Only available with TTY (not piped)
# Piped output: no progress reporting
```

### WT_SESSION Exclude

```typescript
// Windows Terminal interprets OSC 9;4 as notifications, not progress.
if (process.env.WT_SESSION) {
  return false
}
// Windows Terminal: exclude
# OSC 9;4 = notifications, not progress
```

### ConEmu Detection

```typescript
if (process.env.ConEmuANSI || process.env.ConEmuPID || process.env.ConEmuTask) {
  return true
}
// ConEmu: all versions support OSC 9;4
# ConEmuANSI, ConEmuPID, ConEmuTask env vars
```

### TERM_PROGRAM_VERSION coerce

```typescript
import { coerce } from 'semver'
const version = coerce(process.env.TERM_PROGRAM_VERSION)
if (!version) {
  return false
}
// coerce: extract semver version
# Invalid version: return false
```

### Ghostty Version Check

```typescript
if (process.env.TERM_PROGRAM === 'ghostty') {
  return gte(version.version, '1.2.0')
}
// Ghostty 1.2.0+ supports OSC 9;4
# https://ghostty.org/docs/install/release-notes/1-2-0
```

### iTerm2 Version Check

```typescript
if (process.env.TERM_PROGRAM === 'iTerm.app') {
  return gte(version.version, '3.6.6')
}
// iTerm2 3.6.6+ supports OSC 9;4
# https://iterm2.com/downloads.html
```

### semver gte Comparison

```typescript
import { gte } from '../utils/semver.js'
return gte(version.version, '1.2.0')
// gte: greater than or equal
# Version comparison
```

### terminal Feature Detection

```typescript
// Detect terminal features via environment variables
// TERM_PROGRAM: terminal name
// TERM_PROGRAM_VERSION: version string
// Feature-specific env vars (WT_SESSION, ConEmu*)
// Environment variable detection
# Terminal-specific checks
```

## 实现建议

### OpenClaw适配

1. **progressReportingCheck**: isProgressReportingAvailable function
2. **ttyCheck**: TTY check pattern
3. **terminalExclude**: Windows Terminal exclude pattern
4. **conEmuDetection**: ConEmu detection pattern
5. **versionComparison**: semver version comparison

### 状态文件示例

```json
{
  "isTTY": true,
  "terminal": "iTerm.app",
  "version": "3.6.6",
  "progressAvailable": true
}
```

## 关键模式

### TTY First Check

```
process.stdout.isTTY → false if piped → no progress → first check
# TTY检查是第一道门槛
# Piped output无progress reporting
```

### Windows Terminal Exclude

```
WT_SESSION → exclude → OSC 9;4 = notifications → different interpretation
# Windows Terminal不支持progress
# OSC 9;4解释为notifications
# 显式exclude
```

### ConEmu All Versions

```
ConEmuANSI | ConEmuPID | ConEmuTask → true → all versions support → no version check
# ConEmu所有版本支持
# 无需version check
# 直接return true
```

### Version-Based Feature Detection

```
TERM_PROGRAM_VERSION → coerce → gte(version, minVersion) → feature available
# version-based feature detection
# coerce提取semver
# gte比较minimum version
```

### Terminal-Specific Version Requirements

```
Ghostty: 1.2.0+ | iTerm2: 3.6.6+ → different min versions → terminal-specific
# 不同terminal不同minimum version
# Ghostty 1.2.0
# iTerm2 3.6.6
```

## 借用价值

- ⭐⭐⭐⭐⭐ isProgressReportingAvailable pattern
- ⭐⭐⭐⭐⭐ TTY first check pattern
- ⭐⭐⭐⭐⭐ Windows Terminal exclude pattern
- ⭐⭐⭐⭐⭐ ConEmu all versions detection
- ⭐⭐⭐⭐⭐ semver version-based feature detection

## 来源

- Claude Code: `ink/terminal.ts` (248 lines)
- 分析报告: P51-6