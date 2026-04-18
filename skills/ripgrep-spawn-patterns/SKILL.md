# Ripgrep Spawn Patterns Skill

Ripgrep Spawn Patterns - ripGrepRaw spawn vs execFile + argv0 embedded mode + MAX_BUFFER_SIZE 20MB + MAX_JSONL_READ_BYTES 100MB tail + ripGrepStream stream-on-data + partial line carry remainder + ripGrepFileCount stream-count + EAGAIN retry -j 1 + SIGTERM→SIGKILL escalation 5s + settled double-fire guard + Windows close/error both fire + abort race don't flush tail。

## 功能概述

从Claude Code的utils/ripgrep.ts提取的Ripgrep spawn patterns，用于OpenClaw的ripgrep调用。

## 核心机制

### ripGrepRaw spawn vs execFile

```typescript
// For embedded ripgrep, use spawn with argv0 (execFile doesn't support argv0 properly)
if (argv0) {
  const child = spawn(rgPath, fullArgs, { argv0, signal: abortSignal, windowsHide: true })
  // ...
}
// For non-embedded ripgrep, use execFile
return execFile(rgPath, fullArgs, { maxBuffer: MAX_BUFFER_SIZE, signal: abortSignal, timeout, killSignal: 'SIGKILL' })
// spawn vs execFile
# Embedded: spawn + argv0
# Non-embedded: execFile + maxBuffer
```

### argv0 embedded mode

```typescript
// In bundled (native) mode, ripgrep is statically compiled into bun-internal
// and dispatches based on argv[0]. We spawn ourselves with argv0='rg'.
{ mode: 'embedded', command: process.execPath, args: ['--no-config'], argv0: 'rg' }
// argv0 embedded mode
# Bun internal ripgrep
# argv0='rg' dispatches
```

### MAX_BUFFER_SIZE 20MB

```typescript
const MAX_BUFFER_SIZE = 20_000_000 // 20MB; large monorepos can have 200k+ files
// 20MB buffer
# Large monorepos
# 200k+ files
```

### MAX_JSONL_READ_BYTES 100MB tail

```typescript
const MAX_JSONL_READ_BYTES = 100 * 1024 * 1024
// Reads at most the last 100 MB
// For files larger than 100 MB, reads the tail and skips the first partial line
// 100 MB is more than sufficient since longest context window ~2M tokens
// 100MB tail read
# Skip first partial line
# ~2M tokens context window
```

### ripGrepStream stream-on-data

```typescript
child.stdout?.on('data', (chunk: Buffer) => {
  const data = remainder + chunk.toString()
  const lines = data.split('\n')
  remainder = lines.pop() ?? ''
  if (lines.length) onLines(lines.map(stripCR))
})
// Stream-on-data
# Flush complete lines per chunk
# Partial trailing line carry
# First results paint while rg walking
```

### partial line carry remainder

```typescript
let remainder = ''
child.stdout?.on('data', (chunk: Buffer) => {
  const data = remainder + chunk.toString()
  const lines = data.split('\n')
  remainder = lines.pop() ?? ''
  // ...
})
// Remainder carry across chunks
# Partial trailing line
# Carried to next chunk
```

### ripGrepFileCount stream-count

```typescript
async function ripGrepFileCount(args: string[], target: string, abortSignal: AbortSignal): Promise<number> {
  const child = spawn(rgPath, [...rgArgs, ...args, target], { argv0, signal: abortSignal, stdio: ['ignore', 'pipe', 'ignore'] })
  let lines = 0
  child.stdout?.on('data', (chunk: Buffer) => {
    lines += countCharInString(chunk, '\n')
  })
  // ...
}
// Stream-count without buffering
# countCharInString(chunk, '\n')
# Peak memory ~64KB chunk
# No 247k-element array
```

### EAGAIN retry -j 1

```typescript
// If we hit EAGAIN and haven't retried yet, retry with single-threaded mode
if (!isRetry && isEagainError(stderr)) {
  ripGrepRaw(args, target, abortSignal, callback, true)  // true = singleThread
}
// EAGAIN retry
# -j 1 single-threaded
# Transient startup error
# Retry only once
```

### SIGTERM→SIGKILL escalation 5s

```typescript
// Set up timeout with SIGKILL escalation
// SIGTERM alone may not kill ripgrep if blocked in uninterruptible I/O
// If SIGTERM doesn't work within 5 seconds, escalate to SIGKILL
child.kill('SIGTERM')
killTimeoutId = setTimeout(c => c.kill('SIGKILL'), 5_000, child)
// SIGTERM→SIGKILL escalation
# 5s grace period
# Uninterruptible I/O fallback
# SIGKILL cannot be caught
```

### settled double-fire guard

```typescript
// On Windows, both 'close' and 'error' can fire for the same process
// Guard against double-callback
let settled = false
child.on('close', (code, signal) => {
  if (settled) return
  settled = true
  // ...
})
child.on('error', (err) => {
  if (settled) return
  settled = true
  // ...
})
// settled guard
# Windows double-fire
# close and error both fire
# Guard with settled flag
```

### Windows close/error both fire

```typescript
// On Windows, both 'close' and 'error' can fire for the same process
// (e.g. when AbortSignal kills the child)
// Windows platform
# close + error both fire
# Same process
# Guard needed
```

### abort race don't flush tail

```typescript
// Abort races close — don't flush a torn tail from a killed process
// Promise still settles: spawn's signal option fires 'error' with AbortError
if (abortSignal.aborted) return
// abort race
# Don't flush torn tail
# AbortError fires error event
# Not close event
```

## 实现建议

### OpenClaw适配

1. **ripgrepSpawn**: spawn vs execFile pattern
2. **argv0Embedded**: argv0 embedded mode pattern
3. **streamOnData**: ripGrepStream stream-on-data pattern
4. **remainderCarry**: partial line carry remainder pattern
5. **escalationKill**: SIGTERM→SIGKILL escalation pattern

### 状态文件示例

```json
{
  "mode": "embedded",
  "argv0": "rg",
  "maxBuffer": 20000000,
  "lines": 247000
}
```

## 关键模式

### spawn vs execFile Embedded

```
argv0 exists → spawn + argv0 | no argv0 → execFile + maxBuffer → embedded vs non-embedded
# spawn用于embedded (argv0)
# execFile用于non-embedded
```

### Stream-on-Data Flush Lines

```
chunk → remainder + chunk → split('\n') → remainder = pop() → flush lines → first results early
# stream-on-data flush lines
# remainder carry partial
# early results while rg walking
```

### countCharInString Stream-Count

```
lines += countCharInString(chunk, '\n') → no buffering → peak ~64KB → no 247k array
# stream-count without buffering
# countCharInString('\n')
# minimal memory
```

### SIGTERM→SIGKILL Escalation

```
SIGTERM → 5s timeout → SIGKILL → uninterruptible I/O fallback → cannot be caught
# SIGTERM escalation to SIGKILL
# 5s grace period
# uninterruptible I/O
```

### settled Windows Double-Fire

```
settled = false → close: if settled return → error: if settled return → Windows guard
# settled guard
# Windows close+error both fire
# prevent double-callback
```

## 借用价值

- ⭐⭐⭐⭐⭐ spawn vs execFile embedded pattern
- ⭐⭐⭐⭐⭐ Stream-on-data flush lines pattern
- ⭐⭐⭐⭐⭐ countCharInString stream-count pattern
- ⭐⭐⭐⭐⭐ SIGTERM→SIGKILL escalation pattern
- ⭐⭐⭐⭐⭐ settled Windows double-fire guard pattern

## 来源

- Claude Code: `utils/ripgrep.ts` (698 lines)
- 分析报告: P57-1