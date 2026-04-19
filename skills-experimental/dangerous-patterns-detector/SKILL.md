---
name: dangerous-patterns-detector
description: |
  Detect dangerous patterns in commands and tool inputs.
  
  Use when:
  - System needs to protect against destructive operations
  - Permission system validates commands
  - Safety check before execution
  
  NOT for:
  - Direct user invocation (internal service)
  - Already-safe commands
  - Read-only operations
  
  Auto-trigger conditions:
  - Automatically invoked before tool execution
  - Part of permission pipeline
  
  Dangerous patterns:
  - File deletion: rm -rf, rmdir -p
  - Disk operations: dd, mkfs, fdisk
  - Permission changes: chmod 777, chown
  - Network exposure: nc -l, netcat -l
  - System control: reboot, shutdown
  - Process kill: kill -9, killall
  
  Keywords:
  - Internal service - auto-activated by safety checks
metadata:
  openclaw:
    emoji: "⚠️"
    source: claude-code-core
    triggers: [system-internal]
    priority: P0
    userAccessible: false
---

# Dangerous Patterns Detector

危险模式检测器。

## 危险模式列表

| 类别 | 模式 | 风险级别 |
|------|------|----------|
| 文件删除 | `rm -rf /`, `rm -rf ~` | 🔴 极高 |
| 递归删除 | `rmdir -p`, `rm -r` | 🔴 高 |
| 磁盘操作 | `dd if=/dev/zero`, `mkfs` | 🔴 极高 |
| 权限修改 | `chmod 777`, `chmod -R 777` | 🟠 高 |
| 网络监听 | `nc -l`, `netcat -l` | 🟠 高 |
| 系统重启 | `reboot`, `shutdown`, `halt` | 🔴 极高 |
| 强制杀进程 | `kill -9`, `killall` | 🟠 高 |
| 用户切换 | `sudo su`, `su root` | 🟡 中 |

## 实现

```typescript
const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+-rf\s+\//, level: 'critical', reason: 'Root deletion' },
  { pattern: /rm\s+-rf\s+~/, level: 'critical', reason: 'Home deletion' },
  { pattern: /dd\s+if=/dev/zero/, level: 'critical', reason: 'Disk wipe' },
  { pattern: /mkfs/, level: 'critical', reason: 'Format disk' },
  { pattern: /chmod\s+777/, level: 'high', reason: 'Full permissions' },
  { pattern: /reboot|shutdown/, level: 'critical', reason: 'System control' },
  { pattern: /kill\s+-9/, level: 'high', reason: 'Force kill' },
]

function detectDangerousPatterns(input: string): { level: string, reason: string }[] {
  const detected = []
  for (const { pattern, level, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      detected.push({ level, reason })
    }
  }
  return detected
}
```

---

来源: Claude Code utils/permissions/dangerousPatterns.ts