# Terminal Notifier Skill

**优先级**: P32
**来源**: Claude Code `notifier.ts`
**适用场景**: 多终端通知发送

---

## 概述

Terminal Notifier提供多终端通知功能，支持iTerm2、kitty、ghostty、Apple Terminal等。Notification hooks执行，preferred channel配置。

---

## 核心功能

### 1. 多终端支持

```typescript
async function sendToChannel(
  channel: string,
  opts: NotificationOptions,
  terminal: TerminalNotification
): Promise<string> {
  switch (channel) {
    case 'iterm2': terminal.notifyITerm2(opts); return 'iterm2'
    case 'kitty': terminal.notifyKitty({ ...opts, id }); return 'kitty'
    case 'ghostty': terminal.notifyGhostty({ ...opts }); return 'ghostty'
    case 'terminal_bell': terminal.notifyBell(); return 'terminal_bell'
    case 'notifications_disabled': return 'disabled'
  }
}
```

### 2. Auto Channel

```typescript
async function sendAuto(opts: NotificationOptions, terminal): Promise<string> {
  switch (env.terminal) {
    case 'iTerm.app': terminal.notifyITerm2(opts); return 'iterm2'
    case 'kitty': terminal.notifyKitty(opts); return 'kitty'
    case 'ghostty': terminal.notifyGhostty(opts); return 'ghostty'
    case 'Apple_Terminal':
      const bellDisabled = await isAppleTerminalBellDisabled()
      if (bellDisabled) { terminal.notifyBell(); return 'terminal_bell' }
      return 'no_method_available'
    default: return 'no_method_available'
  }
}
```

---

## OpenClaw应用

### 1. 飞书任务完成通知

```typescript
// 任务完成发送终端通知
await sendNotification({
  message: '任务已完成',
  title: 'OpenClaw',
  notificationType: 'task_complete'
}, terminal)
```

---

## 状态文件

```json
{
  "skill": "terminal-notifier",
  "priority": "P32",
  "source": "notifier.ts",
  "enabled": true,
  "channels": ["iterm2", "kitty", "ghostty", "terminal_bell", "auto"],
  "createdAt": "2026-04-12T14:00:00Z"
}
```

---

## 参考

- Claude Code: `notifier.ts`