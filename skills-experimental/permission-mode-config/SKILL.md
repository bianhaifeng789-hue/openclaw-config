# Permission Mode Config Skill

Permission Mode Config - PERMISSION_MODE_CONFIG Partial<Record> + feature('TRANSCRIPT_CLASSIFIER') conditional auto + isExternalPermissionMode guard + toExternalPermissionMode map + permissionModeTitle/ShortTitle/Symbol + getModeColor + permissionModeFromString fallback default + isDefaultMode undefined === default。

## 功能概述

从Claude Code的utils/permissions/PermissionMode.ts提取的Permission mode config，用于OpenClaw的权限模式管理。

## 核心机制

### PERMISSION_MODE_CONFIG Partial<Record>

```typescript
const PERMISSION_MODE_CONFIG: Partial<Record<PermissionMode, PermissionModeConfig>> = {
  default: { title: 'Default', shortTitle: 'Default', symbol: '', color: 'text', external: 'default' },
  plan: { title: 'Plan Mode', shortTitle: 'Plan', symbol: PAUSE_ICON, color: 'planMode', external: 'plan' },
  acceptEdits: { title: 'Accept edits', shortTitle: 'Accept', symbol: '⏵⏵', color: 'autoAccept', external: 'acceptEdits' },
  bypassPermissions: { title: 'Bypass Permissions', shortTitle: 'Bypass', symbol: '⏵⏵', color: 'error', external: 'bypassPermissions' },
  dontAsk: { title: "Don't Ask", shortTitle: 'DontAsk', symbol: '⏵⏵', color: 'error', external: 'dontAsk' },
  ...(feature('TRANSCRIPT_CLASSIFIER') ? { auto: { title: 'Auto mode', shortTitle: 'Auto', symbol: '⏵⏵', color: 'warning', external: 'default' } } : {}),
}
// PERMISSION_MODE_CONFIG
# Partial<Record>
# Conditional auto
# feature flag guard
```

### feature('TRANSCRIPT_CLASSIFIER') conditional auto

```typescript
...(feature('TRANSCRIPT_CLASSIFIER')
  ? { auto: { title: 'Auto mode', shortTitle: 'Auto', symbol: '⏵⏵', color: 'warning', external: 'default' } }
  : {}),
// Conditional auto
# feature flag
# Spread conditional
# ant-only mode
```

### isExternalPermissionMode guard

```typescript
export function isExternalPermissionMode(mode: PermissionMode): mode is ExternalPermissionMode {
  // External users can't have auto, so always true for them
  if (process.env.USER_TYPE !== 'ant') return true
  return mode !== 'auto' && mode !== 'bubble'
}
// isExternalPermissionMode
# USER_TYPE !== 'ant' → true
# auto/bubble excluded
# External guard
```

### toExternalPermissionMode map

```typescript
export function toExternalPermissionMode(mode: PermissionMode): ExternalPermissionMode {
  return getModeConfig(mode).external
}
// toExternalPermissionMode
# Map to external
# Config.external
```

### permissionModeTitle/ShortTitle/Symbol

```typescript
export function permissionModeTitle(mode: PermissionMode): string {
  return getModeConfig(mode).title
}
export function permissionModeShortTitle(mode: PermissionMode): string {
  return getModeConfig(mode).shortTitle
}
export function permissionModeSymbol(mode: PermissionMode): string {
  return getModeConfig(mode).symbol
}
// Title/ShortTitle/Symbol
# getModeConfig
# Config access
```

### getModeColor

```typescript
export function getModeColor(mode: PermissionMode): ModeColorKey {
  return getModeConfig(mode).color
}
// getModeColor
# ModeColorKey
# text/planMode/autoAccept/error/warning
```

### permissionModeFromString fallback default

```typescript
export function permissionModeFromString(str: string): PermissionMode {
  return (PERMISSION_MODES as readonly string[]).includes(str)
    ? (str as PermissionMode)
    : 'default'
}
// permissionModeFromString
# Includes check
# Fallback 'default'
```

### isDefaultMode undefined === default

```typescript
export function isDefaultMode(mode: PermissionMode | undefined): boolean {
  return mode === 'default' || mode === undefined
}
// isDefaultMode
# undefined → default
# Same behavior
```

### getModeConfig fallback default

```typescript
function getModeConfig(mode: PermissionMode): PermissionModeConfig {
  return PERMISSION_MODE_CONFIG[mode] ?? PERMISSION_MODE_CONFIG.default!
}
// getModeConfig
# ?? default fallback
# Always defined
```

## 实现建议

### OpenClaw适配

1. **permissionModeConfig**: PERMISSION_MODE_CONFIG pattern
2. **conditionalSpread**: feature flag conditional spread pattern
3. **externalModeGuard**: isExternalPermissionMode guard pattern
4. **modeAccessors**: Title/ShortTitle/Symbol/Color pattern
5. **fallbackDefault**: ?? default fallback pattern

### 状态文件示例

```json
{
  "mode": "auto",
  "title": "Auto mode",
  "shortTitle": "Auto",
  "symbol": "⏵⏵",
  "color": "warning",
  "external": "default"
}
```

## 关键模式

### Partial<Record> Config Map

```
Partial<Record<PermissionMode, PermissionModeConfig>> → optional entries → ?? default fallback → config map
# Partial<Record> config map
# optional entries
# ?? default fallback
```

### Conditional Spread feature Flag

```
...(feature('TRANSCRIPT_CLASSIFIER') ? { auto: {...} } : {}) → conditional spread → ant-only → feature guard
# conditional spread feature flag
# feature('TRANSCRIPT_CLASSIFIER')
# ant-only auto mode
```

### External Mode USER_TYPE Guard

```
USER_TYPE !== 'ant' → true | mode !== 'auto' && mode !== 'bubble' → external guard → exclude ant-only
# external mode USER_TYPE guard
# USER_TYPE !== 'ant' → always true
# auto/bubble excluded
```

### undefined === default Behavior

```
mode === 'default' || mode === undefined → same behavior → undefined treated as default → isDefaultMode
# undefined === default behavior
# undefined treated as default
# same behavior
```

### ?? default Fallback Config

```
PERMISSION_MODE_CONFIG[mode] ?? PERMISSION_MODE_CONFIG.default! → fallback default → always defined → getModeConfig
# ?? default fallback config
# always defined
# getModeConfig
```

## 借用价值

- ⭐⭐⭐⭐⭐ Partial<Record> config map pattern
- ⭐⭐⭐⭐⭐ Conditional spread feature flag pattern
- ⭐⭐⭐⭐⭐ External mode USER_TYPE guard pattern
- ⭐⭐⭐⭐ undefined === default behavior pattern
- ⭐⭐⭐⭐ ?? default fallback config pattern

## 来源

- Claude Code: `utils/permissions/PermissionMode.ts` (118 lines)
- 分析报告: P58-2