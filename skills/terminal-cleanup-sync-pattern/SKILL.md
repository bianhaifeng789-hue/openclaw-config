# Terminal Cleanup Sync Pattern Skill

Terminal Cleanup Sync Pattern - cleanupTerminalModes + writeSync + DISABLE_MOUSE_TRACKING first + EXIT_ALT_SCREEN via Ink unmount + signal-exit registration + process.exit override + forceExit cascade + terminal modes disabled + sync fs guarantee + no-ops on unsupported + DEC sequences。

## 功能概述

从Claude Code的utils/gracefulShutdown.ts提取的Terminal cleanup sync模式，用于OpenClaw的优雅关闭终端清理。

## 核心机制

### cleanupTerminalModes

```typescript
function cleanupTerminalModes(): void {
  if (!process.stdout.isTTY) {
    return
  }

  try {
    writeSync(1, DISABLE_MOUSE_TRACKING)
    // ... more sequences
  } catch (error) {
    // Ignore errors
  }
}
// Clean up terminal modes synchronously before process exit
```

### writeSync

```typescript
writeSync(1, DISABLE_MOUSE_TRACKING)
// Synchronous write to fd 1 (stdout)
// Ensures sequences written before exit
# /* eslint-disable custom-rules/no-sync-fs -- must be sync to flush before process.exit */
```

### DISABLE_MOUSE_TRACKING First

```typescript
// Disable mouse tracking FIRST, before the React unmount tree-walk.
// The terminal needs a round-trip to process this and stop sending
// events; doing it now (not after unmount) gives that time while
// we're busy unmounting. Otherwise events arrive during cooked-mode
// cleanup and either echo to the screen or leak to the shell.
writeSync(1, DISABLE_MOUSE_TRACKING)
// Mouse tracking disabled FIRST
# Terminal needs round-trip
# Stop sending events early
```

### EXIT_ALT_SCREEN via Ink unmount

```typescript
// Exit alt screen FIRST so printResumeHint() (and all sequences below)
// land on the main buffer.
//
// Unmount Ink directly rather than writing EXIT_ALT_SCREEN ourselves.
// Ink registered its unmount with signal-exit, so it will otherwise run
// AGAIN inside forceExit() → process.exit(). Two problems with letting
// that happen:
//   1. If we write 1049l here and unmount writes it again later, the
//      second one triggers another DECRC — the cursor jumps back over
//      the resume hint and the shell prompt lands on the wrong line.
// Don't write EXIT_ALT_SCREEN ourselves
# Let Ink unmount handle it
# Avoid duplicate 1049l
```

### signal-exit Registration

```typescript
import { onExit } from 'signal-exit'

onExit((signal: number) => {
  cleanupTerminalModes()
  // ... cleanup
})
// signal-exit library
# Handles SIGINT/SIGTERM/SIGHUP
# Cleanup before exit
```

### process.exit Override

```typescript
const originalExit = process.exit
process.exit = (code?: number) => {
  cleanupTerminalModes()
  originalExit(code)
}
// Override process.exit
# Ensure cleanup on exit
```

### forceExit Cascade

```typescript
function forceExit(code: number): void {
  cleanupTerminalModes()
  runCleanupFunctions()
  process.exit(code)
}
// forceExit cascade
# Cleanup → cleanupFunctions → exit
```

### terminal Modes Disabled

```typescript
writeSync(1, DISABLE_MOUSE_TRACKING)
writeSync(1, DISABLE_KITTY_KEYBOARD)
writeSync(1, DISABLE_MODIFY_OTHER_KEYS)
writeSync(1, SHOW_CURSOR)
// ... more sequences
// All terminal modes disabled
# Unconditionally send all
```

### sync fs Guarantee

```typescript
/* eslint-disable custom-rules/no-sync-fs -- must be sync to flush before process.exit */
writeSync(1, sequence)
// Synchronous write required
# Async may not complete before exit
```

### no-ops on Unsupported

```typescript
// We unconditionally send all disable sequences because:
// 1. Terminal detection may not always work correctly (e.g., in tmux, screen)
// 2. These sequences are no-ops on terminals that don't support them
// 3. Failing to disable leaves the terminal in a broken state
// Send all sequences unconditionally
# No-ops on unsupported terminals
# Detection may fail
```

### DEC Sequences

```typescript
import {
  DBP,
  DFE,
  DISABLE_MOUSE_TRACKING,
  EXIT_ALT_SCREEN,
  SHOW_CURSOR,
} from '../ink/termio/dec.js'
// DEC (Digital Equipment Corp) sequences
# Terminal control sequences
```

## 实现建议

### OpenClaw适配

1. **terminalCleanup**: cleanupTerminalModes function
2. **writeSyncPattern**: writeSync pattern
3. **mouseFirst**: DISABLE_MOUSE_TRACKING first pattern
4. **signalExit**: signal-exit registration pattern
5. **noOpsUnsupported**: no-ops on unsupported pattern

### 状态文件示例

```json
{
  "isTTY": true,
  "cleanupDone": true,
  "sequencesSent": ["DISABLE_MOUSE", "SHOW_CURSOR"]
}
```

## 关键模式

### writeSync Before Exit

```
writeSync(fd, sequence) → synchronous → completes before exit → async may not finish
# writeSync确保完成
# async可能未完成就exit
# 必须sync
```

### Mouse Tracking First Reason

```
DISABLE_MOUSE_TRACKING first → terminal needs round-trip → stop events early → avoid leak
# 首先disable mouse tracking
# terminal需要round-trip处理
# 早停止避免event leak
```

### Unconditional Send All

```
send all sequences → no-ops on unsupported → detection may fail → failing leaves broken state
# 无条件发送所有sequences
# unsupported terminals无副作用
# detection可能失败
# 失败导致terminal broken
```

### Ink Unmount vs Write

```
Ink unmount → EXIT_ALT_SCREEN once | write ourselves → duplicate → DECRC twice → cursor wrong line
# 让Ink unmount处理EXIT_ALT_SCREEN
# 自己write会duplicate
# DECRC两次cursor错位
```

### signal-exit Registration

```
onExit(signal) → cleanup → multiple signals → SIGINT/SIGTERM/SIGHUP → graceful
# signal-exit注册cleanup
# 处理多种signals
# graceful shutdown
```

## 借用价值

- ⭐⭐⭐⭐⭐ writeSync before exit pattern
- ⭐⭐⭐⭐⭐ Mouse tracking first pattern
- ⭐⭐⭐⭐⭐ Unconditional send all pattern
- ⭐⭐⭐⭐⭐ Ink unmount vs write duplicate issue
- ⭐⭐⭐⭐⭐ signal-exit registration pattern

## 来源

- Claude Code: `utils/gracefulShutdown.ts` (529 lines)
- 分析报告: P53-5