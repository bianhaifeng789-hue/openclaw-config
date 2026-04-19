# Reg Query Stdout Parse Pattern

## Source
Claude Code: `utils/settings/mdm/settings.ts` (parseRegQueryStdout)

## Pattern
Parse Windows reg query stdout to extract registry string value (REG_SZ or REG_EXPAND_SZ).

## Code Example
```typescript
/**
 * Parse reg query stdout to extract a registry string value.
 * Expected format:
 *     Settings    REG_SZ    {"json":"value"}
 *     Settings    REG_EXPAND_SZ    {"json":"value"}
 */
export function parseRegQueryStdout(
  stdout: string,
  valueName = 'Settings',
): string | null {
  const lines = stdout.split(/\r?\n/)
  // Escape valueName for regex (handle special chars)
  const escaped = valueName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Match: whitespace + valueName + REG_(EXPAND_)?SZ + value
  const re = new RegExp(
    `^\\s+${escaped}\\s+REG_(?:EXPAND_)?SZ\\s+(.*)$`,
    'i'  // Case-insensitive
  )
  for (const line of lines) {
    const match = line.match(re)
    if (match && match[1]) {
      return match[1].trimEnd()  // Trim trailing whitespace
    }
  }
  return null  // Not found
}

// Usage in consumeRawReadResult
if (raw.hklmStdout) {
  const jsonString = parseRegQueryStdout(raw.hklmStdout)
  if (jsonString) {
    const result = parseCommandOutputAsSettings(
      jsonString,
      `Registry: ${WINDOWS_REGISTRY_KEY_PATH_HKLM}\\${WINDOWS_REGISTRY_VALUE_NAME}`
    )
    if (Object.keys(result.settings).length > 0) {
      return { mdm: result, hkcu: EMPTY_RESULT }
    }
  }
}
```

## Key Concepts
1. **Line-by-Line Scan**: stdout.split(/\r?\n/) handles Windows CRLF
2. **Regex Escape**: valueName special chars escaped for regex
3. **REG_SZ + REG_EXPAND_SZ**: Single pattern handles both
4. **Case-Insensitive**: 'i' flag for Windows registry case
5. **Trim End**: Remove trailing whitespace from value

## Benefits
- Robust parsing of Windows registry output
- Handles both REG_SZ and REG_EXPAND_SZ
- Escaped valueName prevents regex injection

## When to Use
- Windows registry value extraction
- Subprocess stdout parsing
- Enterprise policy reading on Windows

## Related Patterns
- MDM Async Startup Load (mdm/settings.ts)
- First Source Wins Policy (mdm/settings.ts)
- Parse Command Output as Settings (mdm/settings.ts)