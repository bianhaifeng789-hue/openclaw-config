# Settings Source Cascade Pattern

## Source
Claude Code: `utils/settings/constants.ts` (175 lines)

## Pattern
Setting sources with priority cascade - later sources override earlier ones.

## Code Example
```typescript
export const SETTING_SOURCES = [
  'userSettings',     // User settings (global) - ~/.claude/settings.json
  'projectSettings',  // Project settings (shared) - .claude/settings.json
  'localSettings',    // Local settings (gitignored) - .claude/settings.local.json
  'flagSettings',     // Flag settings (from --settings flag)
  'policySettings',   // Policy settings (managed-settings.json or remote)
] as const

export type SettingSource = (typeof SETTING_SOURCES)[number]

// Editable sources exclude read-only policy/flag
export type EditableSettingSource = Exclude<
  SettingSource,
  'policySettings' | 'flagSettings'
>

export const SOURCES = [
  'localSettings',
  'projectSettings',
  'userSettings',
] as const satisfies readonly EditableSettingSource[]
```

## Key Concepts
1. **Priority Cascade**: `mergeWith` cascades from low to high priority
2. **Editable vs Read-Only**: policySettings + flagSettings are admin/CLI controlled
3. **Source Display Names**: getSettingSourceName(), getSourceDisplayName()
4. **CLI Flag Parse**: parseSettingSourcesFlag("user,project,local") → SettingSource[]

## Benefits
- Clear priority ordering for conflict resolution
- Separation of admin-controlled vs user-controlled sources
- Consistent display names across UI surfaces

## When to Use
- Settings systems with multiple configuration sources
- Enterprise policy enforcement with user overrides
- Project-local vs global configuration split

## Related Patterns
- Three-Tier Settings Cache (settingsCache.ts)
- First Source Wins Policy (mdm/settings.ts)
- Internal Write Echo Suppression (internalWrites.ts)