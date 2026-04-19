# PID Registry Pattern Skill

PID Registry Pattern - registerSession + PID file + sessions directory + registerCleanup unlink + feature gate + envSessionKind override + onSessionSwitch update + countConcurrentSessions + stale sweep + WSL skip + parseInt guard + process.pid filename。

## 功能概述

从Claude Code的utils/concurrentSessions.ts提取的PID registry模式，用于OpenClaw的并发会话管理。

## 核心机制

### registerSession

```typescript
export async function registerSession(): Promise<boolean> {
  if (getAgentId() != null) return false  // Skip teammates/subagents

  const kind: SessionKind = envSessionKind() ?? 'interactive'
  const dir = getSessionsDir()
  const pidFile = join(dir, `${process.pid}.json`)

  registerCleanup(async () => {
    try {
      await unlink(pidFile)  // Cleanup on exit
    } catch {}
  })
  // ...
}
// Register session with PID file
# registerCleanup unlink on exit
```

### PID File

```typescript
await writeFile(pidFile, jsonStringify({
  pid: process.pid,
  sessionId: getSessionId(),
  cwd: getOriginalCwd(),
  startedAt: Date.now(),
  kind,
  // ...
}))
// PID file: ${process.pid}.json
# Contains session metadata
```

### sessions Directory

```typescript
function getSessionsDir(): string {
  return join(getClaudeConfigHomeDir(), 'sessions')
}
// ~/.claude/sessions/
# Directory for PID files
```

### registerCleanup unlink

```typescript
registerCleanup(async () => {
  try {
    await unlink(pidFile)
  } catch {
    // ENOENT is fine (already deleted or never written)
  }
})
// Cleanup PID file on exit
# Unlink on shutdown
```

### feature Gate

```typescript
if (feature('BG_SESSIONS')) {
  // BG sessions feature gate
}
// Feature gates for conditional code
# Gated so env-var string is DCE'd from external builds
```

### envSessionKind Override

```typescript
function envSessionKind(): SessionKind | undefined {
  if (feature('BG_SESSIONS')) {
    const k = process.env.CLAUDE_CODE_SESSION_KIND
    if (k === 'bg' || k === 'daemon' || k === 'daemon-worker') return k
  }
  return undefined
}
// Kind override from env
# Set by spawner so child can register
```

### onSessionSwitch update

```typescript
onSessionSwitch(id => {
  void updatePidFile({ sessionId: id })
})
// Update PID file on session switch
# --resume / /resume mutates getSessionId()
```

### countConcurrentSessions

```typescript
export async function countConcurrentSessions(): Promise<number> {
  const dir = getSessionsDir()
  let files: string[]
  try {
    files = await readdir(dir)
  } catch (e) {
    return 0  // Conservative: return 0 on error
  }

  let count = 0
  for (const file of files) {
    if (!/^\d+\.json$/.test(file)) continue  // Strict filename guard
    const pid = parseInt(file.slice(0, -5), 10)
    if (pid === process.pid) {
      count++
      continue
    }
    if (isProcessRunning(pid)) {
      count++
    } else if (getPlatform() !== 'wsl') {
      void unlink(join(dir, file)).catch(() => {})  // Sweep stale
    }
  }
  return count
}
// Count live concurrent sessions
# Sweep stale PID files
```

### stale Sweep

```typescript
if (isProcessRunning(pid)) {
  count++
} else if (getPlatform() !== 'wsl') {
  void unlink(join(dir, file)).catch(() => {})
  // Stale file from a crashed session — sweep it
}
// Sweep stale PID files
# Skip on WSL: Windows PID not probeable
```

### WSL Skip

```typescript
if (getPlatform() !== 'wsl') {
  void unlink(join(dir, file)).catch(() => {})
}
// Skip on WSL: if ~/.claude/sessions/ is shared with Windows-native Claude,
// a Windows PID won't be probeable from WSL and we'd falsely delete a live session's file.
# Conservative undercount acceptable
```

### parseInt Guard

```typescript
// Strict filename guard: only `<pid>.json` is a candidate. parseInt's
// lenient prefix-parsing means `2026-03-14_notes.md` would otherwise
// parse as PID 2026 and get swept as stale — silent user data loss.
if (!/^\d+\.json$/.test(file)) continue
// Regex guard: /^\d+\.json$/
# parseInt lenient prefix-parsing
# Prevent false sweep
```

### process.pid filename

```typescript
const pidFile = join(dir, `${process.pid}.json`)
// Filename: ${process.pid}.json
# Unique per process
```

## 实现建议

### OpenClaw适配

1. **pidRegistry**: registerSession + PID file pattern
2. **staleSweep**: Stale PID sweep pattern
3. **parseIntGuard**: parseInt guard pattern
4. **wslSkip**: WSL skip pattern
5. **featureGate**: feature gate pattern

### 状态文件示例

```json
{
  "pid": 12345,
  "sessionId": "abc123",
  "cwd": "/home/user",
  "kind": "interactive",
  "startedAt": 1234567890
}
```

## 关键模式

### PID File Registry

```
${process.pid}.json → writeFile → registerCleanup unlink → cleanup on exit → session registry
# PID file registry
# registerCleanup unlink on exit
# cleanup pattern
```

### Stale Sweep (Non-WSL)

```
!isProcessRunning(pid) → unlink stale → sweep crashed sessions → skip WSL → Windows PID not probeable
# stale sweep pattern
# 清理crashed session PID files
# WSL skip (Windows PID无法probe)
```

### parseInt Regex Guard

```
/^\d+\.json$/.test(file) → strict guard → parseInt lenient → prevent false sweep → 2026-03-14 notes would parse as 2026
# regex guard防止false sweep
# parseInt lenient prefix-parsing
# 防止误删用户数据
```

### Feature Gate DCE

```
feature('BG_SESSIONS') → gated → env-var string DCE'd from external builds → conditional code
# feature gate pattern
# 外部builds DCE掉gated code
# conditional compilation
```

### onSessionSwitch Update

```
onSessionSwitch(id => updatePidFile({sessionId: id})) → --resume updates sessionId → stale sessionId fixed
# onSessionSwitch hook
# --resume时更新sessionId
# 防止stale sessionId
```

## 借用价值

- ⭐⭐⭐⭐⭐ PID file registry pattern
- ⭐⭐⭐⭐⭐ Stale sweep + WSL skip pattern
- ⭐⭐⭐⭐⭐ parseInt regex guard pattern
- ⭐⭐⭐⭐⭐ feature gate DCE pattern
- ⭐⭐⭐⭐⭐ onSessionSwitch update pattern

## 来源

- Claude Code: `utils/concurrentSessions.ts` (204 lines)
- 分析报告: P54-1