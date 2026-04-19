# Backend Detection Cached Result Pattern

## Source
Claude Code: `utils/swarm/backends/registry.ts` (detectAndGetBackend)

## Pattern
Cache detection result for process lifetime + priority flow + fallback handling.

## Code Example
```typescript
let cachedBackend: PaneBackend | null = null
let cachedDetectionResult: BackendDetectionResult | null = null
let inProcessFallbackActive = false

/**
 * Detection priority flow:
 * 1. If inside tmux, always use tmux (even in iTerm2)
 * 2. If in iTerm2 with it2 available, use iTerm2 backend
 * 3. If in iTerm2 without it2, return result indicating setup needed
 * 4. If tmux available, use tmux (creates external session)
 * 5. Otherwise, throw error with instructions
 */
export async function detectAndGetBackend(): Promise<BackendDetectionResult> {
  await ensureBackendsRegistered()

  if (cachedDetectionResult) return cachedDetectionResult  // Cache hit

  const insideTmux = await isInsideTmux()
  const inITerm2 = isInITerm2()

  // Priority 1: Inside tmux → always use tmux
  if (insideTmux) {
    const backend = createTmuxBackend()
    cachedDetectionResult = { backend, isNative: true, needsIt2Setup: false }
    return cachedDetectionResult
  }

  // Priority 2: In iTerm2 with it2 → native iTerm2 panes
  if (inITerm2) {
    const preferTmux = getPreferTmuxOverIterm2()
    if (!preferTmux) {
      const it2Available = await isIt2CliAvailable()
      if (it2Available) {
        const backend = createITermBackend()
        cachedDetectionResult = { backend, isNative: true, needsIt2Setup: false }
        return cachedDetectionResult
      }
    }

    // iTerm2 without it2 → tmux fallback
    const tmuxAvailable = await isTmuxAvailable()
    if (tmuxAvailable) {
      const backend = createTmuxBackend()
      cachedDetectionResult = { backend, isNative: false, needsIt2Setup: !preferTmux }
      return cachedDetectionResult
    }

    throw new Error('iTerm2 detected but it2 CLI not installed. Install with: pip install it2')
  }

  // Priority 3: External tmux session
  const tmuxAvailable = await isTmuxAvailable()
  if (tmuxAvailable) {
    const backend = createTmuxBackend()
    cachedDetectionResult = { backend, isNative: false, needsIt2Setup: false }
    return cachedDetectionResult
  }

  throw new Error(getTmuxInstallInstructions())
}

export function isInProcessEnabled(): boolean {
  if (getIsNonInteractiveSession()) return true  // -p mode

  const mode = getTeammateMode()
  if (mode === 'in-process') return true
  if (mode === 'tmux') return false

  // 'auto' mode
  if (inProcessFallbackActive) return true  // Prior spawn fell back
  const insideTmux = isInsideTmuxSync()
  const inITerm2 = isInITerm2()
  return !insideTmux && !inITerm2  // Use in-process if no pane backend
}

export function markInProcessFallback(): void {
  inProcessFallbackActive = true  // Sticky for session lifetime
}
```

## Key Concepts
1. **Cached Result**: Once detected, fixed for process lifetime
2. **Priority Flow**: tmux > iTerm2+it2 > iTerm2+tmux > external tmux > error
3. **isNative Flag**: True if running inside backend's native environment
4. **needsIt2Setup Flag**: iTerm2 detected but it2 not installed
5. **inProcessFallbackActive**: Sticky flag when spawn fell back

## Benefits
- No repeated detection calls
- Clear priority ordering
- Fallback tracking for UI consistency

## When to Use
- Multi-backend environment detection
- Pane-based vs in-process decision
- User setup guidance

## Related Patterns
- Backend Type Discriminated Union (backends/types.ts)
- Tmux/iTerm2 Detection (backends/detection.ts)
- Teammate Executor Factory (backends/registry.ts)