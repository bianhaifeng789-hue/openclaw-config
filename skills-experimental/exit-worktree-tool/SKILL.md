# Exit Worktree Tool Skill

退出Worktree工具 - Change count fail-closed + Session scope guard + Project root restore + Hooks snapshot restore。

## 功能概述

从Claude Code的ExitWorktreeTool提取的worktree退出模式，用于OpenClaw的git worktree管理。

## 核心机制

### Change Count Fail-Closed

```typescript
async function countWorktreeChanges(worktreePath: string, originalHeadCommit: string | undefined): Promise<ChangeSummary | null> {
  const status = await execFileNoThrow('git', ['-C', worktreePath, 'status', '--porcelain'])
  if (status.code !== 0) return null  // git failure → null
  const changedFiles = count(status.stdout.split('\n'), l => l.trim() !== '')
  
  if (!originalHeadCommit) return null  // no baseline → null, fail-closed
  const revList = await execFileNoThrow('git', ['-C', worktreePath, 'rev-list', '--count', `${originalHeadCommit}..HEAD`])
  if (revList.code !== 0) return null
  const commits = parseInt(revList.stdout.trim(), 10) || 0
  return { changedFiles, commits }
}
// git失败 → null (fail-closed)
// silent 0/0 would destroy real work
```

### Session Scope Guard

```typescript
const session = getCurrentWorktreeSession()
if (!session) {
  return {
    result: false,
    message: 'No-op: there is no active EnterWorktree session to exit. This tool only operates on worktrees created by EnterWorktree in the current session — it will not touch worktrees created manually or in a previous session.',
    errorCode: 1
  }
}
// 只操作EnterWorktree创建的worktree
// 不touch手动创建的
// Scope guard
```

### Project Root Restore

```typescript
function restoreSessionToOriginalCwd(originalCwd: string, projectRootIsWorktree: boolean): void {
  setCwd(originalCwd)
  setOriginalCwd(originalCwd)
  if (projectRootIsWorktree) {
    setProjectRoot(originalCwd)  // only restore when actually changed
    updateHooksConfigSnapshot()  // symmetric restore
  }
  saveWorktreeState(null)
  clearSystemPromptSections()
  clearMemoryFileCaches()
  getPlansDirectory.cache.clear?.()
}
// projectRoot只在was changed时restore
// 保持"stable project identity" contract
```

### Hooks Snapshot Restore

```typescript
if (projectRootIsWorktree) {
  updateHooksConfigSnapshot()  // setup.ts's --worktree block called it, restore symmetrically
}
// --worktree startup → hooks from worktree
// Exit → restore hooks from original
// Symmetric
```

### Discard Changes Gate

```typescript
if (input.action === 'remove' && !input.discard_changes) {
  const summary = await countWorktreeChanges(session.worktreePath, session.originalHeadCommit)
  if (summary === null) {
    return { result: false, message: 'Could not verify worktree state. Refusing without discard_changes: true', errorCode: 3 }
  }
  if (summary.changedFiles > 0 || summary.commits > 0) {
    return { result: false, message: `Worktree has ${changedFiles} files and ${commits} commits. Confirm with discard_changes: true`, errorCode: 2 }
  }
}
// remove + 有changes → require discard_changes: true
// 不自动删除
```

### Tmux Session Kill

```typescript
if (tmuxSessionName) {
  await killTmuxSession(tmuxSessionName)
}
// tmux session → kill
// 完整清理
```

## 实现建议

### OpenClaw适配

1. **changeCount**: Change count fail-closed
2. **sessionScope**: Session scope guard
3. **projectRestore**: Project root restore
4. **hooksRestore**: Hooks snapshot restore

### 状态文件示例

```json
{
  "action": "keep",
  "originalCwd": "/path/to/main",
  "worktreePath": "/path/to/worktree",
  "worktreeBranch": "feature-branch",
  "changedFiles": 3,
  "commits": 2,
  "tmuxSession": "wt-123"
}
```

## 关键模式

### Fail-Closed Count

```
git failure → null → refuse without explicit confirmation
// 不silent 0/0
// 保护用户数据
```

### Session Scope Guard

```
getCurrentWorktreeSession() null → no-op, won't touch manual worktrees
// 只操作自己创建的
// 安全边界
```

### Symmetric Restore

```
EnterWorktree → set hooks/config
ExitWorktree → restore hooks/config
// 对称restore
```

### Discard Changes Gate

```
remove + changes → require discard_changes: true
// explicit confirmation
// 不意外删除
```

## 借用价值

- ⭐⭐⭐⭐⭐ Fail-closed change count
- ⭐⭐⭐⭐⭐ Session scope guard
- ⭐⭐⭐⭐⭐ Symmetric hooks restore
- ⭐⭐⭐⭐ Discard changes gate

## 来源

- Claude Code: `tools/ExitWorktreeTool/ExitWorktreeTool.ts` (8KB+)
- 分析报告: P38-35