# Three-Tier Settings Cache Pattern

## Source
Claude Code: `utils/settings/settingsCache.ts` (93 lines)

## Pattern
Three-tier cache architecture for settings with coordinated invalidation.

## Code Example
```typescript
// Tier 1: Session-level merged cache
let sessionSettingsCache: SettingsWithErrors | null = null

// Tier 2: Per-source cache for getSettingsForSource
const perSourceCache = new Map<SettingSource, SettingsJson | null>()

// Tier 3: Path-keyed cache for parseSettingsFile
type ParsedSettings = { settings: SettingsJson | null; errors: ValidationError[] }
const parseFileCache = new Map<string, ParsedSettings>()

// Coordinated invalidation - single producer pattern
export function resetSettingsCache(): void {
  sessionSettingsCache = null
  perSourceCache.clear()
  parseFileCache.clear()
}

// Cache miss returns undefined; null means "cached no settings"
export function getCachedSettingsForSource(source: SettingSource): SettingsJson | null | undefined {
  return perSourceCache.has(source) ? perSourceCache.get(source) : undefined
}

// Plugin settings base layer (lowest priority)
let pluginSettingsBase: Record<string, unknown> | undefined
```

## Key Concepts
1. **Tier 1**: Merged session settings (final result)
2. **Tier 2**: Per-source settings (intermediate)
3. **Tier 3**: Per-file parsed settings (raw)
4. **Undefined vs Null**: undefined = cache miss, null = cached empty
5. **Single Producer Reset**: fanOut() resets before iterating listeners

## Benefits
- Dedupes disk reads when multiple callers request same data
- Cache hit differentiation (miss vs cached empty)
- Coordinated invalidation prevents stale cascading

## When to Use
- Multi-source configuration systems
- Expensive disk reads + JSON parsing
- Multiple subscribers to same data

## Related Patterns
- Settings Source Cascade (constants.ts)
- Fan-Out Single Reload (changeDetector.ts)
- Memoize TTL (memoize-ttl.ts)