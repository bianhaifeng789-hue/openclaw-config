# Bare Git Repo Security Scrub Pattern

## Source
Claude Code: `utils/sandbox/sandbox-adapter.ts` (bareGitRepoScrubPaths, scrubBareGitRepoFiles)

## Pattern
Scrub planted bare-repo files after sandboxed command - prevent git config escape.

## Code Example
```typescript
// SECURITY: Git's is_git_directory() treats cwd as a bare repo if it has:
// HEAD + objects/ + refs/. An attacker planting these (plus config with
// core.fsmonitor) escapes the sandbox when Claude's unsandboxed git runs.

// Paths that didn't exist at config time - scrub after command
const bareGitRepoScrubPaths: string[] = []

// Build scrub list during convertToSandboxRuntimeConfig
const bareGitRepoFiles = ['HEAD', 'objects', 'refs', 'hooks', 'config']
for (const dir of cwd === originalCwd ? [originalCwd] : [originalCwd, cwd]) {
  for (const gitFile of bareGitRepoFiles) {
    const p = resolve(dir, gitFile)
    try {
      statSync(p)
      denyWrite.push(p)  // Exists - mount /dev/null (ro-bind, no stub)
    } catch {
      bareGitRepoScrubPaths.push(p)  // Doesn't exist - scrub after command
    }
  }
}

/**
 * Delete bare-repo files planted during sandboxed command.
 * Called in cleanupAfterCommand() before unsandboxed git runs.
 */
function scrubBareGitRepoFiles(): void {
  for (const p of bareGitRepoScrubPaths) {
    try {
      rmSync(p, { recursive: true })
      logForDebugging(`[Sandbox] scrubbed planted bare-repo file: ${p}`)
    } catch {
      // ENOENT is expected - nothing was planted
    }
  }
}

// Export in SandboxManager
export const SandboxManager: ISandboxManager = {
  cleanupAfterCommand: (): void => {
    BaseSandboxManager.cleanupAfterCommand()
    scrubBareGitRepoFiles()  // Scrub planted files
  },
}
```

## Key Concepts
1. **Bare Repo Attack**: HEAD + objects/ + refs/ at cwd → git treats as bare repo
2. **fsmonitor Escape**: Attacker plants config with core.fsmonitor → sandbox escape
3. **Two-Phase Defense**: denyWrite existing files, scrub non-existent after command
4. **Cleanup After Command**: Called before unsandboxed git runs
5. **ENOENT Expected**: Common case - nothing was planted

## Benefits
- Prevents git config sandbox escape attack
- Handles both existing and planted files
- Minimal overhead (ENOENT on most calls)

## When to Use
- Sandboxed environments with git operations
- Security-critical file protection
- Cleanup after potentially malicious commands

## Related Patterns
- Git Worktree Main Repo Detection (sandbox-adapter.ts)
- Sandbox Settings Adapter (sandbox-adapter.ts)
- Cleanup Registry Pattern (cleanupRegistry.ts)