---
name: change-detector
description: "Change detector with chokidar FSWatcher. FILE_STABILITY_THRESHOLD_MS=1000, MDM_POLL_INTERVAL_MS=30min. settingsChanged signal. pendingDeletions map. Internal write suppression. Use when [change detector] is needed."
metadata:
  openclaw:
    emoji: "👀"
    triggers: [settings-change, file-watch]
    feishuCard: true
---

# Change Detector Skill - Change Detector

Change Detector 文件监听，支持稳定性阈值。

## 为什么需要这个？

**场景**：
- File watching for settings changes
- Stability thresholds
- MDM polling
- Internal write suppression
- Settings change signal

**Claude Code 方案**：changeDetector.ts + 389+ lines
**OpenClaw 飞书适配**：Change detector + File watching

---

## Constants

```typescript
const FILE_STABILITY_THRESHOLD_MS = 1000  // Wait for file writes to stabilize
const FILE_STABILITY_POLL_INTERVAL_MS = 500  // Polling interval
const INTERNAL_WRITE_WINDOW_MS = 5000  // Internal write window
const MDM_POLL_INTERVAL_MS = 30 * 60 * 1000  // 30 minutes
const DELETION_GRACE_MS = FILE_STABILITY_THRESHOLD_MS + FILE_STABILITY_POLL_INTERVAL_MS + 200
```

---

## Functions

### 1. Initialize

```typescript
async function initialize(): Promise<void> {
  if (getIsRemoteMode()) return
  if (initialized || disposed) return
  initialized = true
  
  // Start MDM poll
  startMdmPoll()
  
  // Register cleanup
  registerCleanup(dispose)
  
  const { dirs, settingsFiles, dropInDir } = await getWatchTargets()
  
  // Create chokidar watcher
  watcher = chokidar.watch([...dirs, ...settingsFiles], {
    awaitWriteFinish: {
      stabilityThreshold: FILE_STABILITY_THRESHOLD_MS,
      pollInterval: FILE_STABILITY_POLL_INTERVAL_MS,
    },
  })
  
  // Setup event handlers
  watcher.on('add', handleAdd)
  watcher.on('change', handleChange)
  watcher.on('unlink', handleUnlink)
}
```

### 2. Settings Changed Signal

```typescript
const settingsChanged = createSignal<[source: SettingSource]>()

// Subscribe to settings changes
settingsChanged.subscribe((source) => {
  applySettingsChange(source, setAppState)
})
```

---

## Internal Write Suppression

```typescript
// Mark internal write
markInternalWrite(path)

// Check if internal write
function consumeInternalWrite(path: string, windowMs: number): boolean {
  const ts = timestamps.get(path)
  if (ts !== undefined && Date.now() - ts < windowMs) {
    timestamps.delete(path)
    return true
  }
  return false
}
```

---

## 飞书卡片格式

### Change Detector 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**👀 Change Detector**\n\n---\n\n**Constants**：\n\n| Constant | Value |\n|----------|-------|\n| FILE_STABILITY_THRESHOLD_MS | 1000 |\n| FILE_STABILITY_POLL_INTERVAL_MS | 500 |\n| INTERNAL_WRITE_WINDOW_MS | 5000 |\n| MDM_POLL_INTERVAL_MS | 30 min |\n| DELETION_GRACE_MS | 1700 |\n\n---\n\n**Features**：\n• chokidar FSWatcher\n• settingsChanged signal\n• pendingDeletions map\n• Internal write suppression\n• MDM polling"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/change-detector-state.json
{
  "watching": false,
  "mdmPolling": false,
  "constants": {
    "stabilityThreshold": 1000,
    "pollInterval": 500,
    "internalWriteWindow": 5000,
    "mdmPollInterval": 1800000
  },
  "stats": {
    "totalChanges": 0,
    "internalWrites": 0,
    "mdmPolls": 0
  },
  "lastUpdate": "2026-04-12T01:20:00Z",
  "notes": "Change Detector Skill 创建完成。等待 file watch 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| changeDetector.ts (389+ lines) | Skill + Detector |
| chokidar | File watcher |
| FILE_STABILITY_THRESHOLD_MS | 1000ms |
| MDM_POLL_INTERVAL_MS | 30min |
| settingsChanged | Signal |

---

## 注意事项

1. **chokidar**：File watching via chokidar
2. **Stability threshold**：1000ms wait for writes
3. **MDM poll**：30 min polling for registry/plist
4. **Signal**：settingsChanged signal
5. **Internal writes**：Suppress own echoes

---

## 自动启用

此 Skill 在 file watch 时自动运行。

---

## 下一步增强

- 飞书 change detector 集成
- Change analytics
- Change debugging