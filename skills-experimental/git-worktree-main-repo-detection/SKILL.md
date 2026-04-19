# Git Worktree Main Repo Detection Pattern

## Source
Claude Code: `utils/sandbox/sandbox-adapter.ts` (detectWorktreeMainRepoPath)

## Pattern
Detect git worktree and resolve main repo path once at initialization - cached for session.

## Code Example
```typescript
// Cached main repo path for worktrees
// undefined = not yet resolved; null = not a worktree
let worktreeMainRepoPath: string | null | undefined

/**
 * Detect if cwd is a git worktree and resolve the main repo path.
 * In a worktree, .git is a file (not directory) containing "gitdir: ...".
 */
async function detectWorktreeMainRepoPath(cwd: string): Promise<string | null> {
  const gitPath = join(cwd, '.git')
  try {
    const gitContent = await readFile(gitPath, { encoding: 'utf8' })
    const gitdirMatch = gitContent.match(/^gitdir:\s*(.+)$/m)
    if (!gitdirMatch?.[1]) return null

    // gitdir may be relative - resolve against cwd
    const gitdir = resolve(cwd, gitdirMatch[1].trim())

    // gitdir format: /path/to/main/repo/.git/worktrees/worktree-name
    // Match /.git/worktrees/ segment specifically
    const marker = `${sep}.git${sep}worktrees${sep}`
    const markerIndex = gitdir.lastIndexOf(marker)
    if (markerIndex > 0) {
      return gitdir.substring(0, markerIndex)  // Main repo path
    }
    return null
  } catch {
    // .git is directory (EISDIR), not file → not a worktree
    return null
  }
}

// Usage in initialize()
async function initialize(sandboxAskCallback?: SandboxAskCallback): Promise<void> {
  // Resolve worktree path once before building config
  // Worktree status doesn't change mid-session
  if (worktreeMainRepoPath === undefined) {
    worktreeMainRepoPath = await detectWorktreeMainRepoPath(getCwdState())
  }

  // If in worktree, allow write to main repo's .git
  if (worktreeMainRepoPath && worktreeMainRepoPath !== cwd) {
    allowWrite.push(worktreeMainRepoPath)
  }
}
```

## Key Concepts
1. **Worktree Detection**: .git is file, not directory
2. **gitdir Format**: `gitdir: /path/to/main/.git/worktrees/name`
3. **Marker Matching**: `.git/worktrees/` segment (not just `.git`)
4. **Resolve Once**: Cached at initialization, never re-resolve
5. **Main Repo Access**: Git operations in worktree need write to main repo

## Benefits
- Git worktree operations work in sandbox
- Single async resolution, then sync refreshConfig
- Avoids path matching false positives (`.github-projects`)

## When to Use
- Git worktree support in sandboxed environments
- Multi-directory git operations
- OS-level sandbox with git CLI

## Related Patterns
- Sandbox Settings Adapter (sandbox-adapter.ts)
- Bare Git Repo Security Scrub (sandbox-adapter.ts)
- Async Resolve + Sync Config Pattern