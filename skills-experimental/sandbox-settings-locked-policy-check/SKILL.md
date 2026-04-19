# Sandbox Settings Locked by Policy Check Pattern

## Source
Claude Code: `utils/sandbox/sandbox-adapter.ts` (areSandboxSettingsLockedByPolicy)

## Pattern
Check if sandbox settings are overridden by higher-priority sources - flagSettings or policySettings.

## Code Example
```typescript
/**
 * Check if sandbox settings are locked by policy.
 * Higher-priority sources overriding localSettings make local changes ineffective.
 */
function areSandboxSettingsLockedByPolicy(): boolean {
  // Sources that override localSettings
  const overridingSources = ['flagSettings', 'policySettings'] as const

  for (const source of overridingSources) {
    const settings = getSettingsForSource(source)

    // Check if any sandbox setting is explicitly set
    if (
      settings?.sandbox?.enabled !== undefined ||
      settings?.sandbox?.autoAllowBashIfSandboxed !== undefined ||
      settings?.sandbox?.allowUnsandboxedCommands !== undefined
    ) {
      return true  // Locked - local changes won't take effect
    }
  }

  return false  // Not locked
}

// Usage in UI - warn user if locked
if (SandboxManager.areSandboxSettingsLockedByPolicy()) {
  console.log('⚠️ Sandbox settings are managed by policy. Local changes will not take effect.')
}
```

## Key Concepts
1. **Overriding Sources**: flagSettings, policySettings > localSettings
2. **Explicitly Set Check**: undefined = not set, any value = locked
3. **Three Key Settings**: enabled, autoAllowBashIfSandboxed, allowUnsandboxedCommands
4. **User Feedback**: Warn that local changes won't work

## Benefits
- Users know if settings are policy-controlled
- Avoid confusion about ineffective local changes
- Clear UI feedback for enterprise environments

## When to Use
- Sandbox settings UI
- User configuration warnings
- Enterprise policy enforcement feedback

## Related Patterns
- First Source Wins Policy (mdm/settings.ts)
- Plugin-Only Policy Lock (pluginOnlyPolicy.ts)
- Settings Source Cascade (constants.ts)