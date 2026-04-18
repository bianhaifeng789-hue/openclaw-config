# OSC Sequence Pattern Skill

OSC Sequence Pattern - OSC_PREFIX + osc() function + ST/BEL terminator + Kitty ST preference + wrapForMultiplexer + tmux DCS passthrough + screen DCS wrap + ClipboardPath type + getClipboardPath + OSC8 hyperlink + OSC52 clipboard。

## 功能概述

从Claude Code的ink/termio/osc.ts提取的OSC序列模式，用于OpenClaw的终端OSC命令。

## 核心机制

### OSC_PREFIX

```typescript
import { BEL, ESC, ESC_TYPE, SEP } from './ansi.js'
export const OSC_PREFIX = ESC + String.fromCharCode(ESC_TYPE.OSC)
// ESC ] = OSC prefix
// Operating System Command
```

### osc() Function

```typescript
/** Generate an OSC sequence: ESC ] p1;p2;...;pN <terminator>
 * Uses ST terminator for Kitty (avoids beeps), BEL for others */
export function osc(...parts: (string | number)[]): string {
  const terminator = env.terminal === 'kitty' ? ST : BEL
  return `${OSC_PREFIX}${parts.join(SEP)}${terminator}`
}
// ESC ] parts ; terminator
# Kitty: ST (no beep)
# Others: BEL
```

### ST/BEL Terminator

```typescript
export const ST = ESC + '\\'  // String Terminator (ESC \)
// BEL: \x07 (Bell character)
// ST: ESC \ (String Terminator)
// Kitty prefers ST (avoids beeps)
// BEL may trigger bell sound
# ST vs BEL choice
```

### Kitty ST Preference

```typescript
const terminator = env.terminal === 'kitty' ? ST : BEL
// Kitty: use ST (no beep)
// Other terminals: use BEL
# Terminal-specific terminator
```

### wrapForMultiplexer

```typescript
/**
 * Wrap an escape sequence for terminal multiplexer passthrough.
 * tmux and GNU screen intercept escape sequences; DCS passthrough
 * tunnels them to the outer terminal unmodified.
 */
export function wrapForMultiplexer(sequence: string): string {
  if (process.env['TMUX']) {
    const escaped = sequence.replaceAll('\x1b', '\x1b\x1b')
    return `\x1bPtmux;${escaped}\x1b\\`
  }
  if (process.env['STY']) {
    return `\x1bP${sequence}\x1b\\`
  }
  return sequence
}
// tmux: DCS tmux passthrough
# screen: DCS passthrough
# No multiplexer: unchanged
```

### tmux DCS Passthrough

```typescript
/**
 * Wrap a payload in tmux's DCS passthrough: ESC P tmux ; <payload> ESC \
 * tmux forwards the payload to the outer terminal, bypassing its own parser.
 * Inner ESCs must be doubled. Requires `set -g allow-passthrough on` in
 * ~/.tmux.conf; without it, tmux silently drops the whole DCS (no regression).
 */
function tmuxPassthrough(payload: string): string {
  return `${ESC}Ptmux;${payload.replaceAll(ESC, ESC + ESC)}${ST}`
}
// ESC P tmux ; payload ESC \
# ESC doubled
# Requires allow-passthrough on
```

### screen DCS Wrap

```typescript
if (process.env['STY']) {
  return `\x1bP${sequence}\x1b\\`
}
// screen: ESC P sequence ESC \
# Simple DCS wrap
```

### ClipboardPath Type

```typescript
export type ClipboardPath = 'native' | 'tmux-buffer' | 'osc52'
// native: pbcopy will run (macOS local)
// tmux-buffer: tmux load-buffer (tmux pane)
// osc52: OSC 52 sequence only (SSH/iTerm2)
```

### getClipboardPath

```typescript
export function getClipboardPath(): ClipboardPath {
  const nativeAvailable =
    process.platform === 'darwin' && !process.env['SSH_CONNECTION']
  if (nativeAvailable) return 'native'
  if (process.env['TMUX']) return 'tmux-buffer'
  return 'osc52'
}
// macOS local: native (pbcopy)
# tmux: tmux-buffer
# Otherwise: osc52
```

### OSC8 Hyperlink

```typescript
// OSC8: ESC ] 8 ; params ; URI ST
// Hyperlink support in terminals
// iTerm2, VS Code, Kitty support OSC8
```

### OSC52 Clipboard

```typescript
// OSC52: ESC ] 52 ; c ; base64-data ST
// Clipboard access via OSC sequence
// Works over SSH if terminal supports
```

## 实现建议

### OpenClaw适配

1. **oscGenerator**: osc() function
2. **terminatorChoice**: ST/BEL terminator choice
3. **multiplexerWrap**: wrapForMultiplexer pattern
4. **clipboardPath**: ClipboardPath type + getClipboardPath
5. **osc8osc52**: OSC8 hyperlink + OSC52 clipboard

### 状态文件示例

```json
{
  "oscSequence": "ESC]8;;https://example.comST",
  "terminator": "ST",
  "multiplexer": "tmux"
}
```

## 关键模式

### Terminal-Specific Terminator

```
env.terminal === 'kitty' → ST | others → BEL → avoid beeps in Kitty
# Kitty用ST避免beep
# 其他terminal用BEL
# Terminal-specific handling
```

### DCS Passthrough Pattern

```
TMUX/STY → DCS wrap → bypass multiplexer parser → outer terminal
# tmux/screen intercept escape sequences
# DCS passthrough绕过parser
# 外terminal收到原sequence
```

### ESC Doubling in tmux

```
payload.replaceAll(ESC, ESC + ESC) → tmux requires doubled ESC → correct passthrough
# tmux要求ESC doubled
# payload中ESC替换为ESC ESC
# 正确passthrough
```

### ClipboardPath Detection

```
darwin + !SSH_CONNECTION → native | TMUX → tmux-buffer | else → osc52
# macOS本地用pbcopy
# tmux用load-buffer
# SSH/iTerm2用OSC52
```

## 借用价值

- ⭐⭐⭐⭐⭐ OSC sequence generator pattern
- ⭐⭐⭐⭐⭐ Terminal-specific terminator choice
- ⭐⭐⭐⭐⭐ DCS passthrough pattern (tmux/screen)
- ⭐⭐⭐⭐⭐ ClipboardPath detection pattern
- ⭐⭐⭐⭐ OSC8 hyperlink + OSC52 clipboard

## 来源

- Claude Code: `ink/termio/osc.ts` (493 lines)
- 分析报告: P50-5