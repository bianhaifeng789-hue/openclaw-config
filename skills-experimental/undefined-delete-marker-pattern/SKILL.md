# Undefined Delete Marker Pattern

## Source
Claude Code: `utils/settings/settings.ts` (updateSettingsForSource)

## Pattern
Use undefined value to mark keys for deletion in mergeWith - never use `delete`.

## Code Example
```typescript
export function updateSettingsForSource(
  source: EditableSettingSource,
  settings: SettingsJson,
): { error: Error | null } {
  // Bypass per-source cache - mergeWith mutates target
  let existingSettings = getSettingsForSourceUncached(source)

  const updatedSettings = mergeWith(
    existingSettings || {},
    settings,
    (objValue, srcValue, key, object) => {
      // Handle undefined as deletion
      if (srcValue === undefined && object && typeof key === 'string') {
        delete object[key]  // Delete here in customizer
        return undefined
      }
      // Arrays: always replace (not merge)
      if (Array.isArray(srcValue)) {
        return srcValue
      }
      return undefined  // Let lodash handle default merge
    },
  )

  // Write updated settings
  markInternalWrite(filePath)
  writeFileSync(filePath, jsonStringify(updatedSettings, null, 2) + '\n')
  resetSettingsCache()
}
```

## Key Concepts
1. **Undefined = Delete**: Pass undefined to remove a key
2. **Customizer Handles Deletion**: mergeWith customizer detects undefined
3. **Never Use delete Directly**: mergeWith only sees present keys
4. **Arrays Replace**: Array values replace, not concatenate (merge vs replace semantics)

## Why This Works
- `delete object.key` removes key from object
- mergeWith iterates over source object keys
- If source has `key: undefined`, customizer sees it
- Customizer can then delete from target object

## Benefits
- Declarative deletion: caller just sets key to undefined
- mergeWith handles all merge logic uniformly
- No separate delete operations needed

## When to Use
- Partial update APIs (PATCH-style)
- Nested object merging with deletions
- Configuration update operations

## Related Patterns
- Settings Source Cascade (constants.ts)
- Three-Tier Settings Cache (settingsCache.ts)
- Fan-Out Single Reload (changeDetector.ts)