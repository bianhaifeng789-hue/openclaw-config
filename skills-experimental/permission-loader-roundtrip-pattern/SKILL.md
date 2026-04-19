# Permission Loader Roundtrip Pattern Skill

Permission Loader Roundtrip Pattern - shouldAllowManagedPermissionRulesOnly policySettings + getSettingsForSourceLenient_FOR_EDITING_ONLY_NOT_FOR_READING + settingsJsonToRules + loadAllPermissionRulesFromDisk + getPermissionRulesForSource + deletePermissionRuleFromSettings + addPermissionRulesToSettings + normalizeEntry roundtrip parse→serialize + legacy names match canonical + EDITABLE_SOURCES runtime check。

## 功能概述

从Claude Code的utils/permissions/permissionsLoader.ts提取的Permission loader roundtrip模式，用于OpenClaw的权限规则加载和管理。

## 核心机制

### shouldAllowManagedPermissionRulesOnly policySettings

```typescript
export function shouldAllowManagedPermissionRulesOnly(): boolean {
  return getSettingsForSource('policySettings')?.allowManagedPermissionRulesOnly === true
}
// shouldAllowManagedPermissionRulesOnly
# policySettings gate
# Only managed rules
# Hide always allow options
```

### shouldShowAlwaysAllowOptions

```typescript
export function shouldShowAlwaysAllowOptions(): boolean {
  return !shouldAllowManagedPermissionRulesOnly()
}
// shouldShowAlwaysAllowOptions
# Show options when not managed-only
# Hide when policy restricts
```

### getSettingsForSourceLenient_FOR_EDITING_ONLY_NOT_FOR_READING

```typescript
/**
 * Lenient version of getSettingsForSource that doesn't fail on ANY validation errors.
 * Simply parses the JSON and returns it as-is without schema validation.
 *
 * Used when loading settings to append new rules (avoids losing existing rules
 * due to validation failures in unrelated fields like hooks).
 *
 * FOR EDITING ONLY - do not use this for reading settings for execution.
 */
function getSettingsForSourceLenient_FOR_EDITING_ONLY_NOT_FOR_READING(
  source: SettingSource,
): SettingsJson | null {
  const filePath = getSettingsFilePathForSource(source)
  if (!filePath) return null
  
  try {
    const { resolvedPath } = safeResolvePath(getFsImplementation(), filePath)
    const content = readFileSync(resolvedPath)
    if (content.trim() === '') return {}
    
    const data = safeParseJSON(content, false)
    // Return raw parsed JSON without validation to preserve all existing settings
    return data && typeof data === 'object' ? (data as SettingsJson) : null
  } catch {
    return null
  }
}
// Lenient loading
# No schema validation
# Preserve existing settings
# FOR EDITING ONLY
```

### settingsJsonToRules

```typescript
function settingsJsonToRules(data: SettingsJson | null, source: PermissionRuleSource): PermissionRule[] {
  if (!data || !data.permissions) return []
  
  const { permissions } = data
  const rules: PermissionRule[] = []
  for (const behavior of SUPPORTED_RULE_BEHAVIORS) {
    const behaviorArray = permissions[behavior]
    if (behaviorArray) {
      for (const ruleString of behaviorArray) {
        rules.push({
          source,
          ruleBehavior: behavior,
          ruleValue: permissionRuleValueFromString(ruleString),
        })
      }
    }
  }
  return rules
}
// settingsJsonToRules
# Parse each rule string
# Convert to PermissionRule
# Preserve source
```

### loadAllPermissionRulesFromDisk

```typescript
export function loadAllPermissionRulesFromDisk(): PermissionRule[] {
  // If allowManagedPermissionRulesOnly is set, only use managed permission rules
  if (shouldAllowManagedPermissionRulesOnly()) {
    return getPermissionRulesForSource('policySettings')
  }
  
  // Otherwise, load from all enabled sources (backwards compatible)
  const rules: PermissionRule[] = []
  for (const source of getEnabledSettingSources()) {
    rules.push(...getPermissionRulesForSource(source))
  }
  return rules
}
// loadAllPermissionRulesFromDisk
# Managed-only gate
# All sources otherwise
# Backwards compatible
```

### getPermissionRulesForSource

```typescript
export function getPermissionRulesForSource(source: SettingSource): PermissionRule[] {
  const settingsData = getSettingsForSource(source)
  return settingsJsonToRules(settingsData, source)
}
// getPermissionRulesForSource
# Single source
# Parse and convert
```

### deletePermissionRuleFromSettings

```typescript
export function deletePermissionRuleFromSettings(rule: PermissionRuleFromEditableSettings): boolean {
  // Runtime check to ensure source is actually editable
  if (!EDITABLE_SOURCES.includes(rule.source as EditableSettingSource)) {
    return false
  }
  
  const ruleString = permissionRuleValueToString(rule.ruleValue)
  const settingsData = getSettingsForSource(rule.source)
  
  // Normalize raw settings entries via roundtrip parse→serialize so legacy
  // names (e.g. "KillShell") match their canonical form ("TaskStop").
  const normalizeEntry = (raw: string): string =>
    permissionRuleValueToString(permissionRuleValueFromString(raw))
  
  if (!behaviorArray.some(raw => normalizeEntry(raw) === ruleString)) {
    return false
  }
  
  // ... delete rule
  return true
}
// deletePermissionRuleFromSettings
# Runtime editability check
# Normalize roundtrip
# Match legacy names
```

### addPermissionRulesToSettings

```typescript
export function addPermissionRulesToSettings(
  { ruleValues, ruleBehavior }: { ruleValues: PermissionRuleValue[], ruleBehavior: PermissionBehavior },
  source: EditableSettingSource,
): boolean {
  // When allowManagedPermissionRulesOnly is enabled, don't persist new permission rules
  if (shouldAllowManagedPermissionRulesOnly()) return false
  
  // Filter out duplicates - normalize existing entries via roundtrip
  // parse→serialize so legacy names match their canonical form.
  const existingRulesSet = new Set(
    existingRules.map(raw => permissionRuleValueToString(permissionRuleValueFromString(raw)))
  )
  const newRules = ruleStrings.filter(rule => !existingRulesSet.has(rule))
  
  // ... add rules
  return true
}
// addPermissionRulesToSettings
# Managed-only gate
# Normalize duplicates
# Roundtrip parse→serialize
```

### normalizeEntry roundtrip parse→serialize

```typescript
// Normalize raw settings entries via roundtrip parse→serialize so legacy
// names (e.g. "KillShell") match their canonical form ("TaskStop").
const normalizeEntry = (raw: string): string =>
  permissionRuleValueToString(permissionRuleValueFromString(raw))
// normalizeEntry roundtrip
# parse → serialize
# KillShell → TaskStop
# Legacy → canonical
```

### legacy names match canonical

```typescript
// Legacy tool names (e.g. "Task") match their canonical form ("Agent")
// via roundtrip parse→serialize in normalizeEntry
// legacy names match canonical
# KillShell → TaskStop
# Task → Agent
# AgentOutputTool → TaskOutput
```

### EDITABLE_SOURCES runtime check

```typescript
const EDITABLE_SOURCES: EditableSettingSource[] = [
  'userSettings',
  'projectSettings',
  'localSettings',
]

export function deletePermissionRuleFromSettings(rule: PermissionRuleFromEditableSettings): boolean {
  // Runtime check to ensure source is actually editable
  if (!EDITABLE_SOURCES.includes(rule.source as EditableSettingSource)) {
    return false
  }
  // ...
}
// EDITABLE_SOURCES runtime check
# userSettings, projectSettings, localSettings
# policySettings excluded
# Runtime guard
```

## 实现建议

### OpenClaw适配

1. **managedOnlyGate**: shouldAllowManagedPermissionRulesOnly pattern
2. **lenientLoading**: FOR_EDITING_ONLY_NOT_FOR_READING pattern
3. **roundtripNormalize**: parse→serialize roundtrip pattern
4. **legacyMatch**: KillShell→TaskStop match pattern
5. **editableCheck**: EDITABLE_SOURCES runtime check pattern

### 状态文件示例

```json
{
  "source": "userSettings",
  "editable": true,
  "legacy": "KillShell",
  "canonical": "TaskStop"
}
```

## 关键模式

### Managed-Only Policy Gate

```
policySettings.allowManagedPermissionRulesOnly === true → only managed rules → hide always allow → policy gate
# managed-only policy gate
# policySettings gate
# only managed rules
```

### Lenient Loading Preserve Existing

```
safeParseJSON without schema validation → preserve existing settings → avoid losing on hooks validation failure → FOR EDITING ONLY
# lenient loading preserve existing
# no validation
# preserve all settings
```

### Roundtrip Parse→Serialize Normalize

```
permissionRuleValueFromString(raw) → permissionRuleValueToString(parsed) → normalizeEntry → KillShell → TaskStop → legacy match
# roundtrip parse→serialize normalize
# KillShell → TaskStop
# legacy → canonical
```

### Legacy Names Match Canonical

```
KillShell → TaskStop | Task → Agent | AgentOutputTool → TaskOutput → legacy names → canonical match → roundtrip normalize
# legacy names match canonical
# parse→serialize roundtrip
# match renamed tools
```

### Editable Sources Runtime Guard

```
EDITABLE_SOURCES.includes(source) → runtime check → userSettings/projectSettings/localSettings → policySettings excluded → editable guard
# editable sources runtime guard
# runtime check
# policySettings excluded
```

## 借用价值

- ⭐⭐⭐⭐⭐ Managed-only policy gate pattern
- ⭐⭐⭐⭐⭐ Lenient loading preserve existing pattern
- ⭐⭐⭐⭐⭐ Roundtrip parse→serialize normalize pattern
- ⭐⭐⭐⭐⭐ Legacy names match canonical pattern
- ⭐⭐⭐⭐⭐ Editable sources runtime guard pattern

## 来源

- Claude Code: `utils/permissions/permissionsLoader.ts` (177 lines)
- 分析报告: P59-4