# MDM Async Startup Load Pattern

## Source
Claude Code: `utils/settings/mdm/settings.ts` (218 lines)

## Pattern
Fire MDM subprocess early, await before first settings read, 30-minute poll refresh.

## Code Example
```typescript
let mdmLoadPromise: Promise<void> | null = null
let mdmCache: MdmResult | null = null
let hkcuCache: MdmResult | null = null

// Fire early at startup (cli.tsx evaluation)
export function startMdmSettingsLoad(): void {
  if (mdmLoadPromise) return
  mdmLoadPromise = (async () => {
    profileCheckpoint('mdm_load_start')
    const startTime = Date.now()

    // Use startup raw read if available, otherwise fire fresh
    const rawPromise = getMdmRawReadPromise() ?? fireRawRead()
    const { mdm, hkcu } = consumeRawReadResult(await rawPromise)
    mdmCache = mdm
    hkcuCache = hkcu

    profileCheckpoint('mdm_load_end')
    logForDebugging(`MDM settings load completed in ${Date.now() - startTime}ms`)
  })()
}

// Await before first settings read
export async function ensureMdmSettingsLoaded(): Promise<void> {
  if (!mdmLoadPromise) startMdmSettingsLoad()
  await mdmLoadPromise
}

// Sync cache readers (used by settings pipeline)
export function getMdmSettings(): MdmResult {
  return mdmCache ?? EMPTY_RESULT
}

export function getHkcuSettings(): MdmResult {
  return hkcuCache ?? EMPTY_RESULT
}

// 30-minute poll refresh (changeDetector.ts)
function startMdmPoll(): void {
  const initial = getMdmSettings()
  const initialHkcu = getHkcuSettings()
  lastMdmSnapshot = jsonStringify({ mdm: initial.settings, hkcu: initialHkcu.settings })

  mdmPollTimer = setInterval(async () => {
    if (disposed) return
    const { mdm: current, hkcu: currentHkcu } = await refreshMdmSettings()
    const currentSnapshot = jsonStringify({ mdm: current.settings, hkcu: currentHkcu.settings })

    if (currentSnapshot !== lastMdmSnapshot) {
      lastMdmSnapshot = currentSnapshot
      setMdmSettingsCache(current, currentHkcu)  // Update cache
      fanOut('policySettings')  // Notify listeners
    }
  }, MDM_POLL_INTERVAL_MS)

  mdmPollTimer.unref()  // Don't keep process alive
}
```

## Key Concepts
1. **Early Fire**: startMdmSettingsLoad() at cli.tsx evaluation
2. **Await Before Read**: ensureMdmSettingsLoaded() before first getSettings
3. **Subprocess Raw Read**: plutil (macOS) or reg query (Windows)
4. **30-Minute Poll**: Registry/plist can't use filesystem events
5. **Snapshot Compare**: jsonStringify compare for change detection
6. **Timer.unref()**: Don't keep process alive for poll timer

## Benefits
- MDM subprocess runs parallel to module loading
- First settings read doesn't block on subprocess
- Periodic refresh for registry/plist changes
- Clean cache management for poll updates

## When to Use
- OS-level configuration (MDM, registry, plist)
- Settings that can't be watched via filesystem events
- Enterprise policy enforcement

## Related Patterns
- First Source Wins Policy (mdm/settings.ts)
- Change Detector with Deletion Grace (changeDetector.ts)
- Startup Profiler Pattern (startupProfiler.ts)