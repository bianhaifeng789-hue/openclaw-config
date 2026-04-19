---
name: concurrent-sessions
description: "Concurrent session registry. registerSession + SessionKind (interactive/bg/daemon/daemon-worker) + SessionStatus (busy/idle/waiting) + PID file (process.pid.json) + isBgSession + claude ps. Use when [concurrent sessions] is needed."
metadata:
  openclaw:
    emoji: "📋"
    triggers: [session-register, concurrent-sessions]
    feishuCard: true
---

# Concurrent Sessions Skill - Concurrent Sessions

Concurrent Sessions 并发会话注册工具。

## 为什么需要这个？

**场景**：
- Register session for `claude ps`
- SessionKind tracking（interactive/bg/daemon/daemon-worker）
- PID file registry
- Concurrent session management
- Session status tracking

**Claude Code 方案**：concurrentSessions.ts + 200+ lines
**OpenClaw 飞书适配**：Concurrent sessions + Session registry

---

## Types

### SessionKind

```typescript
type SessionKind = 'interactive' | 'bg' | 'daemon' | 'daemon-worker'
```

### SessionStatus

```typescript
type SessionStatus = 'busy' | 'idle' | 'waiting'
```

---

## Functions

### 1. Register Session

```typescript
async function registerSession(): Promise<boolean> {
  if (getAgentId() != null) return false

  const kind: SessionKind = envSessionKind() ?? 'interactive'
  const dir = getSessionsDir()
  const pidFile = join(dir, `${process.pid}.json`)

  registerCleanup(async () => {
    try {
      await unlink(pidFile)
    } catch {
      // ENOENT is fine
    }
  })

  try {
    await mkdir(dir, { recursive: true, mode: 0o700 })
    await chmod(dir, 0o700)
    await writeFile(
      pidFile,
      jsonStringify({
        pid: process.pid,
        sessionId: getSessionId(),
        cwd: getOriginalCwd(),
        startedAt: Date.now(),
        kind,
        entrypoint: process.env.CLAUDE_CODE_ENTRYPOINT,
        // Feature flags
        ...(feature('UDS_INBOX') && { messagingSocketPath: process.env.CLAUDE_CODE_MESSAGING_SOCKET }),
        ...(feature('BG_SESSIONS') && {
          name: process.env.CLAUDE_CODE_SESSION_NAME,
          logPath: process.env.CLAUDE_CODE_SESSION_LOG,
          agent: process.env.CLAUDE_CODE_AGENT,
        }),
      }),
    )
    // Update on session switch
    onSessionSwitch(id => {
      void updatePidFile({ sessionId: id })
    })
    return true
  } catch (e) {
    logForDebugging(`[concurrentSessions] register failed: ${errorMessage(e)}`)
    return false
  }
}
```

### 2. Is BG Session

```typescript
function isBgSession(): boolean {
  return envSessionKind() === 'bg'
}
```

---

## PID File

```json
{
  "pid": 12345,
  "sessionId": "abc123",
  "cwd": "/path/to/project",
  "startedAt": 1713200000000,
  "kind": "interactive",
  "entrypoint": "cli"
}
```

---

## 飞书卡片格式

### Concurrent Sessions 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📋 Concurrent Sessions**\n\n---\n\n**SessionKind**：\n• interactive\n• bg\n• daemon\n• daemon-worker\n\n---\n\n**SessionStatus**：\n• busy\n• idle\n• waiting\n\n---\n\n**Functions**：\n• registerSession() - Register session\n• isBgSession() - Check bg session\n• updateSessionName() - Update name\n\n---\n\n**PID File**：{pid}.json"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/concurrent-sessions-state.json
{
  "sessions": [],
  "stats": {
    "totalRegistered": 0
  },
  "lastUpdate": "2026-04-12T11:02:00Z",
  "notes": "Concurrent Sessions Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| concurrentSessions.ts (200+ lines) | Skill + Sessions |
| registerSession() | Register |
| SessionKind | Kind type |
| PID file | Registry |

---

## 注意事项

1. **PID file**：~/.claude/sessions/{pid}.json
2. **Cleanup**：Unlink on exit
3. **Session switch**：Update sessionId
4. **Skip agents**：AgentId check
5. **claude ps**：List all sessions

---

## 自动启用

此 Skill 在 session registration 时自动运行。

---

## 下一步增强

- 飞书 session 集成
- Session analytics
- Session debugging