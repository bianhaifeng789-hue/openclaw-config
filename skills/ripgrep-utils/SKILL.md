---
name: ripgrep-utils
description: "Ripgrep utilities. RipgrepConfig (system/builtin/embedded) + ripgrepCommand + RipgrepTimeoutError + countFilesRoundedRg + USE_BUILTIN_RIPGREP env + argv0 for embedded mode + MAX_BUFFER_SIZE=20MB + WSL timeout (60s vs 20s) + EAGAIN handling + Single-thread fallback. Use when [ripgrep utils] is needed."
metadata:
  openclaw:
    emoji: "🔎"
    triggers: [ripgrep, file-search]
    feishuCard: true
---

# Ripgrep Utils Skill - Ripgrep Utils

Ripgrep Utils Ripgrep 工具。

## 为什么需要这个？

**场景**：
- File search
- Count files
- Embedded/system/builtin modes
- Timeout handling
- EAGAIN recovery

**Claude Code 方案**：ripgrep.ts + 680+ lines
**OpenClaw 飞书适配**：Ripgrep utils + File search

---

## Constants

```typescript
const MAX_BUFFER_SIZE = 20_000_000 // 20MB
```

---

## Types

### RipgrepConfig

```typescript
type RipgrepConfig = {
  mode: 'system' | 'builtin' | 'embedded'
  command: string
  args: string[]
  argv0?: string
}
```

### RipgrepTimeoutError

```typescript
export class RipgrepTimeoutError extends Error {
  constructor(
    message: string,
    public readonly partialResults: string[],
  ) {
    super(message)
    this.name = 'RipgrepTimeoutError'
  }
}
```

---

## Environment Variable

- `USE_BUILTIN_RIPGREP` - Use bundled ripgrep
- `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS` - Timeout in seconds

---

## Functions

### 1. Get Ripgrep Config

```typescript
const getRipgrepConfig = memoize((): RipgrepConfig => {
  const userWantsSystemRipgrep = isEnvDefinedFalsy(process.env.USE_BUILTIN_RIPGREP)

  // Try system ripgrep
  if (userWantsSystemRipgrep) {
    const { cmd: systemPath } = findExecutable('rg', [])
    if (systemPath !== 'rg') {
      return { mode: 'system', command: 'rg', args: [] }
    }
  }

  // Bundled mode - argv0='rg' for embedded
  if (isInBundledMode()) {
    return {
      mode: 'embedded',
      command: process.execPath,
      args: ['--no-config'],
      argv0: 'rg',
    }
  }

  // Builtin ripgrep
  const rgRoot = path.resolve(__dirname, 'vendor', 'ripgrep')
  const command = process.platform === 'win32'
    ? path.resolve(rgRoot, `${process.arch}-win32`, 'rg.exe')
    : path.resolve(rgRoot, `${process.arch}-${process.platform}`, 'rg')

  return { mode: 'builtin', command, args: [] }
})
```

### 2. Ripgrep Command

```typescript
export function ripgrepCommand(): {
  rgPath: string
  rgArgs: string[]
  argv0?: string
} {
  const config = getRipgrepConfig()
  return {
    rgPath: config.command,
    rgArgs: config.args,
    argv0: config.argv0,
  }
}
```

### 3. Count Files

```typescript
export function countFilesRoundedRg(
  target: string,
  abortSignal: AbortSignal,
  pattern?: string,
): Promise<number> {
  // Implementation...
}
```

---

## Timeout Handling

| Platform | Default Timeout |
|----------|----------------|
| **WSL** | 60s（3-5x slower） |
| **Other** | 20s |

---

## EAGAIN Recovery

```typescript
function isEagainError(stderr: string): boolean {
  return (
    stderr.includes('os error 11') ||
    stderr.includes('Resource temporarily unavailable')
  )
}

// Retry with single-threaded mode
if (isEagainError(stderr)) {
  return ripGrepRaw(args, target, abortSignal, callback, true)
}
```

---

## 飞书卡片格式

### Ripgrep Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔎 Ripgrep Utils**\n\n---\n\n**Modes**：\n• system - USE_BUILTIN_RIPGREP=false\n• builtin - Bundled ripgrep\n• embedded - argv0='rg'\n\n---\n\n**Constants**：\n• MAX_BUFFER_SIZE = 20MB\n• WSL timeout = 60s\n• Default timeout = 20s\n\n---\n\n**Error Handling**：\n• RipgrepTimeoutError\n• EAGAIN recovery\n• Single-thread fallback"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/ripgrep-utils-state.json
{
  "stats": {
    "totalSearches": 0,
    "timeoutErrors": 0,
    "eagainRetries": 0
  },
  "lastUpdate": "2026-04-12T12:37:00Z",
  "notes": "Ripgrep Utils Skill 创建完成。"
}