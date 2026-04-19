# Settings Edit Before-After Validate Pattern

## Source
Claude Code: `utils/settings/validateEditTool.ts` (43 lines)

## Pattern
Validate settings file before AND after edit - block if after is invalid, allow if before was already invalid.

## Code Example
```typescript
export function validateInputForSettingsFileEdit(
  filePath: string,
  originalContent: string,
  getUpdatedContent: () => string,
): Extract<ValidationResult, { result: false }> | null {
  // Only validate Claude settings files
  if (!isClaudeSettingsPath(filePath)) {
    return null
  }

  // Check BEFORE version
  const beforeValidation = validateSettingsFileContent(originalContent)

  if (!beforeValidation.isValid) {
    // Before was invalid - allow the edit (user is fixing it)
    return null
  }

  // Before was valid - ensure AFTER is also valid
  const updatedContent = getUpdatedContent()
  const afterValidation = validateSettingsFileContent(updatedContent)

  if (!afterValidation.isValid) {
    return {
      result: false,
      message: `Settings validation failed after edit:\n${afterValidation.error}\n\nFull schema:\n${afterValidation.fullSchema}`,
      errorCode: 10,
    }
  }

  return null  // Both valid - allow edit
}

// Usage in FileEditTool
const validation = validateInputForSettingsFileEdit(
  filePath,
  originalContent,
  () => applyEdits(originalContent, edits)
)
if (validation) {
  return validation  // Block edit
}
```

## Key Concepts
1. **Before Check**: If already invalid, allow edit (user fixing)
2. **After Check**: If before valid but after invalid, block
3. **Closure Pattern**: getUpdatedContent() delays edit application
4. **Settings Path Filter**: isClaudeSettingsPath() gates validation
5. **Error Code**: errorCode: 10 for settings validation failure

## Benefits
- Allows users to fix invalid settings files
- Prevents introducing new validation errors
- Lazy evaluation of updated content

## When to Use
- File edit tools for configuration files
- Schema validation for user-editable files
- Fix-or-block validation logic

## Related Patterns
- Zod Error Formatting (validation.ts)
- Settings File Content Validation (validation.ts)
- File Edit Tool (FileEditTool.ts)