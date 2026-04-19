# Streaming Tokenizer Skill

Streaming Tokenizer - Tokenizer type + feed(input) + flush() + reset() + buffer() + State machine + x10Mouse option + ground/escape/csi/ss3/osc/dcs/apc states + incomplete sequence buffering + Token type (text/sequence)。

## 功能概述

从Claude Code的ink/termio/tokenize.ts提取的流式tokenizer模式，用于OpenClaw的终端输入解析。

## 核心机制

### Tokenizer Type

```typescript
export type Tokenizer = {
  /** Feed input and get resulting tokens */
  feed(input: string): Token[]
  /** Flush any buffered incomplete sequences */
  flush(): Token[]
  /** Reset tokenizer state */
  reset(): void
  /** Get any buffered incomplete sequence */
  buffer(): string
}
// Streaming tokenizer interface
# feed: process input
# flush: force output incomplete
# reset: clear state
# buffer: get incomplete sequence
```

### feed(input)

```typescript
feed(input: string): Token[] {
  const result = tokenize(input, currentState, currentBuffer, false, x10Mouse)
  currentState = result.state.state
  currentBuffer = result.state.buffer
  return result.tokens
}
// Process input, return tokens
# Update state and buffer
# Returns Token array
```

### flush()

```typescript
flush(): Token[] {
  const result = tokenize('', currentState, currentBuffer, true, x10Mouse)
  currentState = result.state.state
  currentBuffer = result.state.buffer
  return result.tokens
}
// Force output incomplete sequences
# Call tokenize with flush=true
# Return buffered tokens
```

### reset()

```typescript
reset(): void {
  currentState = 'ground'
  currentBuffer = ''
}
// Reset to initial state
# Clear state and buffer
```

### buffer()

```typescript
buffer(): string {
  return currentBuffer
}
// Get incomplete sequence buffer
# Returns buffered string
```

### State Machine

```typescript
type State =
  | 'ground'          // Normal text
  | 'escape'          // After ESC
  | 'escapeIntermediate'  // After ESC + intermediate
  | 'csi'             // CSI sequence
  | 'ss3'             // SS3 sequence
  | 'osc'             // OSC sequence
  | 'dcs'             // DCS sequence
  | 'apc'             // APC sequence
// State machine states
# Different escape sequence types
```

### x10Mouse Option

```typescript
type TokenizerOptions = {
  /**
   * Treat `CSI M` as an X10 mouse event prefix and consume 3 payload bytes.
   * Only enable for stdin input — `\x1b[M` is also CSI DL (Delete Lines) in
   * output streams.
   */
  x10Mouse?: boolean
}
// X10 mouse event handling
# Only for stdin input
# CSI M has dual meaning
```

### ground State

```typescript
'ground'  // Normal text state
// No escape sequence active
# Collect text tokens
```

### escape State

```typescript
'escape'  // After ESC (0x1b)
// Waiting for sequence type
# ESC detected
```

### csi State

```typescript
'csi'  // CSI sequence (ESC [)
// Collecting CSI parameters
# CSI sequence active
```

### osc State

```typescript
'osc'  // OSC sequence (ESC ])
// Collecting OSC parameters until BEL/ST
# OSC sequence active
```

### incomplete Sequence Buffering

```typescript
let currentBuffer = ''
// Buffer incomplete sequences
// Feed may not complete sequence
# Buffer until complete
```

### Token Type

```typescript
export type Token =
  | { type: 'text'; value: string }      // Normal text
  | { type: 'sequence'; value: string }  // Escape sequence
// Token types
# text: normal text chunk
# sequence: escape sequence
```

## 实现建议

### OpenClaw适配

1. **tokenizerType**: Tokenizer interface
2. **feedFlushReset**: feed/flush/reset pattern
3. **stateMachine**: State machine pattern
4. **x10MouseOption**: x10Mouse option handling
5. **incompleteBuffering**: Incomplete sequence buffering

### 状态文件示例

```json
{
  "state": "csi",
  "buffer": "\x1b[31",
  "tokens": [],
  "x10Mouse": false
}
```

## 关键模式

### Streaming Feed Pattern

```
feed(input) → tokens + update state → may not complete → buffer incomplete
# feed处理输入
# 返回tokens
# 可能不完成
# buffer保存incomplete
```

### flush Force Output

```
flush() → force output incomplete → tokenize('', state, buffer, true) → buffered tokens
# flush强制输出
# tokenize with flush=true
# 返回buffered tokens
```

### State Machine States

```
ground → escape → csi/ss3/osc/dcs/apc → sequence complete → ground
# ground: normal text
# escape: ESC detected
# sequence type state
# complete → ground
```

### x10Mouse Dual Meaning

```
CSI M → X10 mouse (stdin) | CSI DL (Delete Lines) (output) → option toggles behavior
# CSI M双重含义
# stdin: X10 mouse event
# output: CSI DL (Delete Lines)
# option控制
```

### Incomplete Buffering

```
feed('\x1b[') → no token, buffer='\x1b[' | feed('A') → token='\x1b[A', buffer=''
# feed可能不完成sequence
# buffer保存incomplete
# 下次feed完成
# 返回完整token
```

## 借用价值

- ⭐⭐⭐⭐⭐ Streaming tokenizer pattern
- ⭐⭐⭐⭐⭐ feed/flush/reset interface
- ⭐⭐⭐⭐⭐ State machine pattern
- ⭐⭐⭐⭐⭐ x10Mouse dual meaning handling
- ⭐⭐⭐⭐⭐ Incomplete sequence buffering

## 来源

- Claude Code: `ink/termio/tokenize.ts` (319 lines)
- 分析报告: P51-2