# Sandbox Violation Tag Remover Pattern

## Source
Claude Code: `utils/sandbox/sandbox-ui-utils.ts` (removeSandboxViolationTags)

## Pattern
Regex remove sandbox_violations tags from text for UI display.

## Code Example
```typescript
/**
 * Remove <sandbox_violations> tags from text.
 * Used to clean up error messages for display purposes.
 */
export function removeSandboxViolationTags(text: string): string {
  return text.replace(/<sandbox_violations>[\s\S]*?<\/sandbox_violations>/g, '')
}

// Usage in UI components
const cleanError = removeSandboxViolationTags(errorMessage)
console.log(cleanError)  // Shows error without violation details

// Example input:
// "Command failed <sandbox_violations>
//   - Network access to example.com denied
//   - File write to /etc/passwd denied
// </sandbox_violations>"

// Example output:
// "Command failed"
```

## Key Concepts
1. **Tag Format**: `<sandbox_violations>...</sandbox_violations>`
2. **Regex Pattern**: `[\s\S]*?` matches any char including newline (non-greedy)
3. **Global Replace**: `g` flag removes all occurrences
4. **UI Cleanup**: Violation details hidden from user-facing messages

## Benefits
- Clean error messages for UI
- Hides detailed security violations
- Simple one-line utility

## When to Use
- UI error message display
- Log sanitization for user output
- Security violation hiding

## Related Patterns
- Sandbox Settings Adapter (sandbox-adapter.ts)
- Annotate Stderr with Sandbox Failures (sandbox-runtime)
- Error Message Formatting (errors.ts)