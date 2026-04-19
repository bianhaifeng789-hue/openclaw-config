# Environment Detection Module-Load Capture Pattern

## Source
Claude Code: `utils/swarm/backends/detection.ts` (ORIGINAL_USER_TMUX, ORIGINAL_TMUX_PANE)

## Pattern
Capture environment variables at module load time before Shell.ts overrides.

## Code Example
```typescript
/**
 * Captured at module load time to detect if user started Claude from within tmux.
 * Shell.ts may override TMUX env var later, so we capture the original value.
 */
// eslint-disable-next-line custom-rules/no-process-env-top-level
const ORIGINAL_USER_TMUX = process.env.TMUX

/**
 * Captured at module load time to get the leader's tmux pane ID.
 * TMUX_PANE is set by tmux to the pane ID (e.g., %0, %1) when inside tmux.
 */
// eslint-disable-next-line custom-rules/no-process-env-top-level
const ORIGINAL_TMUX_PANE = process.env.TMUX_PANE

let isInsideTmuxCached: boolean | null = null
let isInITerm2Cached: boolean | null = null

/**
 * Checks if we're currently running inside a tmux session.
 * Uses the original TMUX value captured at module load, not process.env.TMUX,
 * because Shell.ts overrides TMUX when Claude's socket is initialized.
 *
 * IMPORTANT: We ONLY check the TMUX env var. We do NOT run `tmux display-message`
 * as a fallback because that succeeds if ANY tmux server is running on the system,
 * not just if THIS process is inside tmux.
 */
export async function isInsideTmux(): Promise<boolean> {
  if (isInsideTmuxCached !== null) return isInsideTmuxCached
  isInsideTmuxCached = !!ORIGINAL_USER_TMUX  // Use captured value
  return isInsideTmuxCached
}

export function isInsideTmuxSync(): boolean {
  return !!ORIGINAL_USER_TMUX
}

export function getLeaderPaneId(): string | null {
  return ORIGINAL_TMUX_PANE || null
}

export function isInITerm2(): boolean {
  if (isInITerm2Cached !== null) return isInITerm2Cached

  const termProgram = process.env.TERM_PROGRAM
  const hasItermSessionId = !!process.env.ITERM_SESSION_ID
  const terminalIsITerm = env.terminal === 'iTerm.app'

  isInITerm2Cached = termProgram === 'iTerm.app' || hasItermSessionId || terminalIsITerm
  return isInITerm2Cached
}

export function resetDetectionCache(): void {
  isInsideTmuxCached = null
  isInITerm2Cached = null
}
```

## Key Concepts
1. **Module-Load Capture**: const ORIGINAL_USER_TMUX = process.env.TMUX (top-level)
2. **Shell.ts Override Protection**: Use captured value, not current process.env
3. **TMUX_PANE Capture**: Leader's pane ID for layout operations
4. **Single-Source Detection**: TMUX env var only, not tmux display-message
5. **Cache + Reset**: Cache result + reset for testing

## Benefits
- Correct detection after Shell.ts socket override
- Fast sync detection (no subprocess spawn)
- Test reset capability

## When to Use
- Environment detection before process.env modification
- Tmux/iTerm2 native environment check
- Leader pane identification

## Related Patterns
- Backend Detection Cached Result (backends/registry.ts)
- Lazy Schema Pattern (lazySchema.ts)
- Platform Utils (platform.ts)