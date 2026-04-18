# Sandbox Excluded Commands Add Pattern

## Source
Claude Code: `utils/sandbox/sandbox-adapter.ts` (addToExcludedCommands)

## Pattern
Add command to excludedCommands list with permission rule pattern extraction.

## Code Example
```typescript
/**
 * Add command to excludedCommands (commands that should not be sandboxed).
 * Extracts pattern from Bash permission rule suggestions if present.
 */
export function addToExcludedCommands(
  command: string,
  permissionUpdates?: Array<{
    type: string
    rules: Array<{ toolName: string; ruleContent?: string }>
  }>,
): string {
  const existingSettings = getSettingsForSource('localSettings')
  const existingExcludedCommands = existingSettings?.sandbox?.excludedCommands || []

  // Determine command pattern to add
  let commandPattern: string = command

  if (permissionUpdates) {
    // Extract pattern from Bash rule suggestions
    const bashSuggestions = permissionUpdates.filter(
      update =>
        update.type === 'addRules' &&
        update.rules.some(rule => rule.toolName === BASH_TOOL_NAME),
    )

    if (bashSuggestions.length > 0 && bashSuggestions[0]!.type === 'addRules') {
      const firstBashRule = bashSuggestions[0]!.rules.find(
        rule => rule.toolName === BASH_TOOL_NAME,
      )
      if (firstBashRule?.ruleContent) {
        // Extract from Bash(command) or Bash(command:*) format
        const prefix = permissionRuleExtractPrefix(firstBashRule.ruleContent)
        commandPattern = prefix || firstBashRule.ruleContent
      }
    }
  }

  // Add to excludedCommands if not already present
  if (!existingExcludedCommands.includes(commandPattern)) {
    updateSettingsForSource('localSettings', {
      sandbox: {
        ...existingSettings?.sandbox,
        excludedCommands: [...existingExcludedCommands, commandPattern],
      },
    })
  }

  return commandPattern  // Return the pattern added
}

// Usage when user allows a command
const pattern = addToExcludedCommands('npm run test', [
  { type: 'addRules', rules: [{ toolName: 'Bash', ruleContent: 'npm run test:*' }] }
])
console.log(pattern)  // "npm run test"
```

## Key Concepts
1. **Excluded Commands**: Commands that bypass sandbox
2. **Pattern Extraction**: Extract from Bash(cmd) or Bash(cmd:*) rule
3. **Permission Rule Prefix**: permissionRuleExtractPrefix(cmd:*) → cmd
4. **Settings Update**: updateSettingsForSource('localSettings', ...)
5. **Duplicate Check**: Only add if not already in list

## Benefits
- User-allowed commands bypass sandbox
- Pattern extraction from permission suggestions
- Local settings persistence

## When to Use
- User allows a sandboxed command
- Permission rule → excluded command mapping
- Bash command pattern handling

## Related Patterns
- Undefined Delete Marker Pattern (settings.ts)
- Permission Rule Extract Prefix (sandbox-adapter.ts)
- Permission Rule Value Parser (permissionRuleParser.ts)