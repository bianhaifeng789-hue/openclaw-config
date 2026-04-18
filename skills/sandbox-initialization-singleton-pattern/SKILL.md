# Sandbox Initialization Singleton Pattern

## Source
Claude Code: `utils/sandbox/sandbox-adapter.ts` (initialize, initializationPromise)

## Pattern
Singleton initialization promise - create before await to prevent race conditions.

## Code Example
```typescript
let initializationPromise: Promise<void> | undefined
let settingsSubscriptionCleanup: (() => void) | undefined

/**
 * Initialize sandbox with log monitoring.
 */
async function initialize(sandboxAskCallback?: SandboxAskCallback): Promise<void> {
  // If already initializing or initialized, return the promise
  if (initializationPromise) {
    return initializationPromise
  }

  // Check if sandboxing is enabled
  if (!isSandboxingEnabled()) return

  // Wrap callback to enforce allowManagedDomainsOnly policy
  const wrappedCallback: SandboxAskCallback | undefined = sandboxAskCallback
    ? async (hostPattern: NetworkHostPattern) => {
        if (shouldAllowManagedSandboxDomainsOnly()) {
          logForDebugging(`[sandbox] Blocked ${hostPattern.host} (allowManagedDomainsOnly)`)
          return false
        }
        return sandboxAskCallback(hostPattern)
      }
    : undefined

  // Create promise SYNCHRONOUSLY before any await (prevent race)
  initializationPromise = (async () => {
    try {
      // Resolve worktree path once (cached for session)
      if (worktreeMainRepoPath === undefined) {
        worktreeMainRepoPath = await detectWorktreeMainRepoPath(getCwdState())
      }

      const settings = getSettings_DEPRECATED()
      const runtimeConfig = convertToSandboxRuntimeConfig(settings)

      await BaseSandboxManager.initialize(runtimeConfig, wrappedCallback)

      // Subscribe to settings changes (dynamic config update)
      settingsSubscriptionCleanup = settingsChangeDetector.subscribe(() => {
        const newConfig = convertToSandboxRuntimeConfig(getSettings_DEPRECATED())
        BaseSandboxManager.updateConfig(newConfig)
      })
    } catch (error) {
      // Clear promise on error so initialization can retry
      initializationPromise = undefined
      logForDebugging(`Failed to initialize sandbox: ${errorMessage(error)}`)
    }
  })()

  return initializationPromise
}

/**
 * Wrap command with sandbox (ensure initialization complete)
 */
async function wrapWithSandbox(
  command: string,
  binShell?: string,
  customConfig?: Partial<SandboxRuntimeConfig>,
  abortSignal?: AbortSignal,
): Promise<string> {
  if (isSandboxingEnabled()) {
    if (initializationPromise) {
      await initializationPromise  // Ensure init complete
    } else {
      throw new Error('Sandbox failed to initialize')
    }
  }
  return BaseSandboxManager.wrapWithSandbox(command, binShell, customConfig, abortSignal)
}
```

## Key Concepts
1. **Promise Before Await**: Create promise synchronously to prevent race
2. **Return Existing**: If promise exists, return it (singleton)
3. **Clear on Error**: Allow retry by clearing promise on failure
4. **Settings Subscription**: Dynamic config update on settings change
5. **Wrapped Callback**: Enforce allowManagedDomainsOnly policy

## Benefits
- Prevents multiple initialization calls
- Race condition protection (wrapWithSandbox before init)
- Dynamic config updates from settings changes

## When to Use
- Singleton async initialization
- Settings-driven config updates
- Callback policy enforcement

## Related Patterns
- Settings Change Detector (changeDetector.ts)
- Git Worktree Main Repo Detection (sandbox-adapter.ts)
- Memoize Pattern (memoize.ts)