# First Source Wins Policy Pattern

## Source
Claude Code: `utils/settings/mdm/settings.ts` + `settings.ts`

## Pattern
Policy settings use "first source wins" - highest priority source provides ALL settings.

## Code Example
```typescript
// Policy priority: remote > HKLM/plist > file > HKCU
export function getSettingsForSource(source: SettingSource): SettingsJson | null {
  if (source === 'policySettings') {
    // First source wins - return first that has content
    const remoteSettings = getRemoteManagedSettingsSyncFromCache()
    if (remoteSettings && Object.keys(remoteSettings).length > 0) {
      return remoteSettings  // Highest - wins immediately
    }

    const mdmResult = getMdmSettings()  // HKLM or macOS plist
    if (Object.keys(mdmResult.settings).length > 0) {
      return mdmResult.settings
    }

    const { settings: fileSettings } = loadManagedFileSettings()
    if (fileSettings) {
      return fileSettings
    }

    const hkcu = getHkcuSettings()  // Lowest - user-writable
    if (Object.keys(hkcu.settings).length > 0) {
      return hkcu.settings
    }

    return null
  }
  // ... other sources use merge cascade
}

// Origin tracking for UI
export function getPolicySettingsOrigin():
  | 'remote' | 'plist' | 'hklm' | 'file' | 'hkcu' | null {
  if (remoteSettings?.length > 0) return 'remote'
  if (mdmResult?.length > 0) return getPlatform() === 'macos' ? 'plist' : 'hklm'
  if (fileSettings) return 'file'
  if (hkcu?.length > 0) return 'hkcu'
  return null
}

// Managed file settings: base + drop-ins (alphabetical merge)
export function loadManagedFileSettings(): { settings: SettingsJson | null; errors: ValidationError[] } {
  let merged: SettingsJson = {}
  // Base file first (lowest precedence)
  const { settings } = parseSettingsFile(getManagedSettingsFilePath())
  if (settings) merged = mergeWith(merged, settings, customizer)

  // Drop-ins alphabetically sorted (later files win)
  const entries = readdirSync(dropInDir)
    .filter(d => d.endsWith('.json') && !d.startsWith('.'))
    .sort()
  for (const name of entries) {
    const { settings } = parseSettingsFile(join(dropInDir, name))
    if (settings) merged = mergeWith(merged, settings, customizer)
  }
  return { settings: merged, errors }
}
```

## Key Concepts
1. **First Source Wins**: Not merge cascade - first non-empty wins entirely
2. **Priority Order**: remote > HKLM/plist > file > HKCU
3. **Drop-In Directory**: managed-settings.d/*.json alphabetical merge
4. **Origin Tracking**: getPolicySettingsOrigin() for UI display
5. **HKCU Lowest**: User-writable, skipped if higher source exists

## Benefits
- Clear admin policy precedence
- Separate teams can ship independent policy fragments
- No partial merge confusion - one source controls all

## When to Use
- Enterprise policy enforcement
- MDM/registry-based configuration
- Admin-controlled vs user-writable split

## Related Patterns
- Settings Source Cascade (constants.ts)
- MDM Async Startup Load (mdm/settings.ts)
- Plugin-Only Policy Lock (pluginOnlyPolicy.ts)