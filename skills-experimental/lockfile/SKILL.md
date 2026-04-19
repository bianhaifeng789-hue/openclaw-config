---
name: lockfile
description: "File-based locking with proper-lockfile. Lazy accessor + lock/lockSync/unlock/check + Concurrent access protection + Deferred import (avoid 8ms startup cost). Use when [lockfile] is needed."
metadata:
  openclaw:
    emoji: "🔒"
    triggers: [lock-acquire, lock-release]
    feishuCard: true
---

# Lockfile Skill - Lockfile

Lockfile 文件锁定保护。

## 为什么需要这个？

**场景**：
- File-based locking
- Concurrent access protection
- Lazy import（defer cost）
- Lock/unlock/check
- Sync/async operations

**Claude Code 方案**：lockfile.ts + 51 lines
**OpenClaw 飞书适配**：Lockfile + Concurrent protection

---

## Functions

### 1. Lock (Async)

```typescript
function lock(
  file: string,
  options?: LockOptions,
): Promise<() => Promise<void>> {
  return getLockfile().lock(file, options)
}
```

### 2. Lock (Sync)

```typescript
function lockSync(
  file: string,
  options?: LockOptions,
): () => void {
  return getLockfile().lockSync(file, options)
}
```

### 3. Unlock

```typescript
function unlock(
  file: string,
  options?: UnlockOptions,
): Promise<void> {
  return getLockfile().unlock(file, options)
}
```

### 4. Check

```typescript
function check(
  file: string,
  options?: CheckOptions,
): Promise<boolean> {
  return getLockfile().check(file, options)
}
```

---

## Lazy Import

```typescript
let _lockfile: Lockfile | undefined

function getLockfile(): Lockfile {
  if (!_lockfile) {
    _lockfile = require('proper-lockfile')  // Deferred import
  }
  return _lockfile
}
```

---

## 飞书卡片格式

### Lockfile 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔒 Lockfile**\n\n---\n\n**Functions**：\n• lock() - Async lock\n• lockSync() - Sync lock\n• unlock() - Release lock\n• check() - Check locked\n\n---\n\n**Lazy Import**：\n• Deferred import\n• Avoid 8ms startup cost\n• proper-lockfile\n\n---\n\n**Use Cases**：\n• Concurrent access protection\n• File-based locking\n• Multi-process safety"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/lockfile-state.json
{
  "locks": [],
  "stats": {
    "totalLocks": 0,
    "totalUnlocks": 0,
    "failedLocks": 0
  },
  "lastUpdate": "2026-04-12T02:00:00Z",
  "notes": "Lockfile Skill 创建完成。等待 lock 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| lockfile.ts (51 lines) | Skill + Lock |
| Lazy accessor | Deferred import |
| lock/unlock/check | Methods |
| 8ms cost avoided | Startup optimization |

---

## 注意事项

1. **Lazy import**：Avoid startup cost
2. **File-based**：proper-lockfile
3. **Sync/async**：Both modes
4. **Concurrent**：Multi-process safe
5. **Cleanup**：Unlock on dispose

---

## 自动启用

此 Skill 在 lock operation 时自动运行。

---

## 下一步增强

- 飞书 lock 集成
- Lock analytics
- Lock debugging