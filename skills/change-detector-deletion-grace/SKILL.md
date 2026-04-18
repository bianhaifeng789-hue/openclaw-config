# Change Detector with Deletion Grace Pattern

## Source
Claude Code: `utils/settings/changeDetector.ts` (415 lines)

## Pattern
Chokidar file watcher with deletion grace period + MDM polling + ConfigChange hooks.

## Code Example
```typescript
// Constants
const FILE_STABILITY_THRESHOLD_MS = 1000  // Wait for write to stabilize
const FILE_STABILITY_POLL_INTERVAL_MS = 500
const INTERNAL_WRITE_WINDOW_MS = 5000     // Suppress own writes
const DELETION_GRACE_MS = 1200            // > stability threshold
const MDM_POLL_INTERVAL_MS = 30 * 60 * 1000  // 30 minutes

// Pending deletions map - cancel on add/change
const pendingDeletions = new Map<string, ReturnType<typeof setTimeout>>()

// Chokidar setup
watcher = chokidar.watch(dirs, {
  persistent: true,
  ignoreInitial: true,
  depth: 0,  // Only immediate children
  awaitWriteFinish: {
    stabilityThreshold: FILE_STABILITY_THRESHOLD_MS,
    pollInterval: FILE_STABILITY_POLL_INTERVAL_MS,
  },
  ignored: (path, stats) => {
    if (stats && !stats.isFile() && !stats.isDirectory()) return true  // Skip sockets/FIFOs
    if (path.split.sep.some(dir => dir === '.git')) return true
    // Only watch known settings files
    return !settingsFiles.has(normalize(path))
  },
})

// Deletion handler with grace period
function handleDelete(path: string): void {
  const timer = setTimeout(() => {
    pendingDeletions.delete(path)
    // Fire ConfigChange hook first
    void executeConfigChangeHooks(source, path).then(results => {
      if (hasBlockingResult(results)) return  // Hook blocked
      fanOut(source)
    })
  }, DELETION_GRACE_MS)
  pendingDeletions.set(path, timer)
}

// Add/change cancels pending deletion (delete-and-recreate pattern)
function handleAdd(path: string): void {
  const pendingTimer = pendingDeletions.get(path)
  if (pendingTimer) {
    clearTimeout(pendingTimer)
    pendingDeletions.delete(path)
  }
  handleChange(path)
}

// Fan-out with single cache reset (single producer)
function fanOut(source: SettingSource): void {
  resetSettingsCache()  // MUST happen here, not in each listener
  settingsChanged.emit(source)
}
```

## Key Concepts
1. **awaitWriteFinish**: Wait for file stability before processing
2. **Deletion Grace**: Cancel deletion if file recreated within window
3. **ConfigChange Hook Blocking**: exit code 2 or decision:'block' skips apply
4. **Fan-Out Single Reset**: One notification = one disk reload
5. **MDM Poll**: Registry/plist can't use filesystem events, poll 30min

## Benefits
- Handles atomic writes (temp file → rename)
- Absorbs delete-and-recreate patterns (auto-updater, other session startup)
- Prevents N-way thrashing (N listeners = N reloads)
- ConfigChange hooks can block unwanted changes

## When to Use
- Hot-reload settings/config systems
- Enterprise policy enforcement
- Multiple subscribers to file changes

## Related Patterns
- Internal Write Echo Suppression (internalWrites.ts)
- Three-Tier Settings Cache (settingsCache.ts)
- Run-Once Gate Check Hook (bypassPermissionsKillswitch.ts)