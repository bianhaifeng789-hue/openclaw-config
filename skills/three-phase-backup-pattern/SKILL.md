# Three-Phase Backup Pattern Skill

Three-Phase Backup Pattern - fileHistoryTrackEdit + Phase 1 check captured + Phase 2 async backup + Phase 3 commit re-check + backupFileName null for new files + mtime check + MAX_SNAPSHOTS 100 + snapshotSequence counter + shallow-spread update + trackedFileBackups retroactive。

## 功能概述

从Claude Code的utils/fileHistory.ts提取的Three-phase backup模式，用于OpenClaw的文件历史备份。

## 核心机制

### fileHistoryTrackEdit

```typescript
export async function fileHistoryTrackEdit(
  updateFileHistoryState: (updater: (prev: FileHistoryState) => FileHistoryState) => void,
  filePath: string,
  messageId: UUID,
): Promise<void> {
  if (!fileHistoryEnabled()) return

  const trackingPath = maybeShortenFilePath(filePath)

  // Phase 1: check if backup is needed
  let captured: FileHistoryState | undefined
  updateFileHistoryState(state => {
    captured = state
    return state
  })

  // Phase 2: async backup
  let backup: FileHistoryBackup
  try {
    backup = await createBackup(filePath, 1)
  } catch (error) {
    logError(error)
    return
  }

  // Phase 3: commit. Re-check tracked (another trackEdit may have raced)
  updateFileHistoryState(state => {
    // ...
  })
}
// Three-phase backup
# Phase 1: check captured
# Phase 2: async backup
# Phase 3: commit re-check
```

### Phase 1 check captured

```typescript
// Phase 1: check if backup is needed. Speculative writes would overwrite
// the deterministic {hash}@v1 backup on every repeat call — a second
// trackEdit after an edit would corrupt v1 with post-edit content.
let captured: FileHistoryState | undefined
updateFileHistoryState(state => {
  captured = state
  return state
})
if (!captured) return
const mostRecent = captured.snapshots.at(-1)
if (!mostRecent) return
if (mostRecent.trackedFileBackups[trackingPath]) {
  // Already tracked; next makeSnapshot will re-check mtime
  return
}
// Check captured state
# Prevent duplicate backup
# Speculative writes corrupt v1
```

### Phase 2 async backup

```typescript
// Phase 2: async backup.
let backup: FileHistoryBackup
try {
  backup = await createBackup(filePath, 1)
} catch (error) {
  logError(error)
  logEvent('tengu_file_history_track_edit_failed', {})
  return
}
const isAddingFile = backup.backupFileName === null
// Async backup
# createBackup(filePath, 1)
# backupFileName === null → new file
```

### Phase 3 commit re-check

```typescript
// Phase 3: commit. Re-check tracked (another trackEdit may have raced).
updateFileHistoryState((state: FileHistoryState) => {
  try {
    const mostRecentSnapshot = state.snapshots.at(-1)
    if (!mostRecentSnapshot || mostRecentSnapshot.trackedFileBackups[trackingPath]) {
      return state  // Already tracked by race
    }
    // ...
  } catch (error) {
    return state
  }
})
// Re-check tracked on commit
# Another trackEdit may have raced
# Re-check before commit
```

### backupFileName null for new files

```typescript
const isAddingFile = backup.backupFileName === null
// backupFileName: string | null
// null = file does not exist in this version (new file)
# null indicates new file
```

### mtime check

```typescript
// Re-check mtime and re-backup if changed
// makeSnapshot checks mtime before backup
# mtime modification time check
# Re-backup if changed
```

### MAX_SNAPSHOTS 100

```typescript
const MAX_SNAPSHOTS = 100
// Maximum 100 snapshots
# Evict old snapshots
```

### snapshotSequence counter

```typescript
// Monotonically-increasing counter incremented on every snapshot, even when
// old snapshots are evicted. Used by useGitDiffStats as an activity signal
// (snapshots.length plateaus once the cap is reached).
snapshotSequence: number
// Monotonically-increasing
# Activity signal
# Doesn't plateau like snapshots.length
```

### shallow-spread update

```typescript
// Shallow-spread is sufficient: backup values are never mutated after
// insertion, so we only need fresh top-level + trackedFileBackups refs
// for React change detection. A deep clone would copy every existing
// backup's Date/string fields — O(n) cost to add one entry.
const updatedMostRecentSnapshot = {
  ...mostRecentSnapshot,
  trackedFileBackups: {
    ...mostRecentSnapshot.trackedFileBackups,
    [trackingPath]: backup,
  },
}
// Shallow-spread sufficient
# Backup values never mutated
# O(1) vs O(n) deep clone
```

### trackedFileBackups retroactive

```typescript
// This file has not already been tracked in the most recent snapshot, so we
// need to retroactively track a backup there.
const updatedMostRecentSnapshot = {
  ...mostRecentSnapshot,
  trackedFileBackups: {
    ...mostRecentSnapshot.trackedFileBackups,
    [trackingPath]: backup,
  },
}
// Retroactive track
# Add to most recent snapshot
# Not create new snapshot
```

## 实现建议

### OpenClaw适配

1. **threePhaseBackup**: Three-phase backup pattern
2. **phaseCommit**: Phase 1 check + Phase 2 backup + Phase 3 commit
3. **shallowSpread**: Shallow-spread update pattern
4. **snapshotSequence**: snapshotSequence counter pattern
5. **backupNullNew**: backupFileName null for new files

### 状态文件示例

```json
{
  "snapshots": [...],
  "trackedFiles": ["file1.ts", "file2.ts"],
  "snapshotSequence": 50,
  "MAX_SNAPSHOTS": 100
}
```

## 关键模式

### Three-Phase Backup

```
Phase 1: check captured → Phase 2: async backup → Phase 3: commit re-check → race handling
# 三阶段备份
# Phase 1检查
# Phase 2异步备份
# Phase 3 commit re-check
```

### Race Re-Check on Commit

```
another trackEdit may have raced → re-check trackedFileBackups → already tracked → return state
# commit时re-check race
# another trackEdit可能race
# re-check避免duplicate
```

### Shallow-Spread O(1)

```
shallow-spread vs deep clone → backup values never mutated → O(1) vs O(n) → React change detection
# shallow-spread足够
# backup values never mutated
# O(1) vs O(n) deep clone
```

### snapshotSequence Activity Signal

```
snapshotSequence++ on every snapshot → monotonically-increasing → activity signal → doesn't plateau
# snapshotSequence monotonically-increasing
# activity signal
# 不plateau（snapshots.length会plateau）
```

### backupFileName null = New File

```
backupFileName === null → file does not exist → new file → no backup needed
# backupFileName null表示new file
# file不存在
# 无需backup
```

## 借用价值

- ⭐⭐⭐⭐⭐ Three-phase backup pattern
- ⭐⭐⭐⭐⭐ Race re-check on commit pattern
- ⭐⭐⭐⭐⭐ Shallow-spread O(1) pattern
- ⭐⭐⭐⭐⭐ snapshotSequence activity signal pattern
- ⭐⭐⭐⭐⭐ backupFileName null = new file pattern

## 来源

- Claude Code: `utils/fileHistory.ts` (1115 lines)
- 分析报告: P54-3