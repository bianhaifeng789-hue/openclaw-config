# Git Repo Sync Check Pattern

## Source
Claude Code: `utils/memory/versions.ts` (projectIsInGitRepo)

## Pattern
Sync git repo check via findGitRoot filesystem walk (no subprocess).

## Code Example
```typescript
import { findGitRoot } from '../git.js'

// Note: This is used to check git repo status synchronously
// Uses findGitRoot which walks the filesystem (no subprocess)
// Prefer `dirIsInGitRepo()` for async checks
export function projectIsInGitRepo(cwd: string): boolean {
  return findGitRoot(cwd) !== null
}
```

## Key Concepts
1. **Sync Check**: findGitRoot walks filesystem, no subprocess spawn
2. **Null Return**: findGitRoot returns null if not in git repo
3. **Async Alternative**: dirIsInGitRepo() preferred for async context
4. **Filesystem Walk**: .git directory detection via path traversal
5. **No Subprocess**: Avoids git rev-parse --show-toplevel overhead

## Benefits
- Fast sync check without subprocess
- Useful in sync-only contexts
- Lower overhead than async version

## When to Use
- Sync context requiring git status
- Filesystem-based git detection
- Performance-critical sync checks

## Related Patterns
- Git Utils (git.ts)
- Git Worktree Detection (sandbox-adapter.ts)
- Repository Detection (detectRepository.ts)