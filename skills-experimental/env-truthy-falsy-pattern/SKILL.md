# Env Truthy/Falsy Pattern Skill

Env Truthy/Falsy Pattern - isEnvTruthy + isEnvDefinedFalsy + ['1','true','yes','on'] truthy + ['0','false','no','off'] falsy + boolean return + memoize getClaudeConfigHomeDir + CLAUDE_CONFIG_DIR key + normalize().trim().toLowerCase() + hasNodeOption split + parseEnvVars KEY=VALUE。

## 功能概述

从Claude Code的utils/envUtils.ts提取的Env truthy/falsy模式，用于OpenClaw的环境变量解析。

## 核心机制

### isEnvTruthy

```typescript
export function isEnvTruthy(envVar: string | boolean | undefined): boolean {
  if (!envVar) return false
  if (typeof envVar === 'boolean') return envVar
  const normalizedValue = envVar.toLowerCase().trim()
  return ['1', 'true', 'yes', 'on'].includes(normalizedValue)
}
// Check if env var is truthy
# ['1', 'true', 'yes', 'on'] = truthy
# Case-insensitive
# Trim whitespace
```

### isEnvDefinedFalsy

```typescript
export function isEnvDefinedFalsy(
  envVar: string | boolean | undefined,
): boolean {
  if (envVar === undefined) return false
  if (typeof envVar === 'boolean') return !envVar
  if (!envVar) return false
  const normalizedValue = envVar.toLowerCase().trim()
  return ['0', 'false', 'no', 'off'].includes(normalizedValue)
}
// Check if env var is explicitly defined as falsy
# undefined → false (not defined)
# ['0', 'false', 'no', 'off'] = defined falsy
# Different from !isEnvTruthy
```

### ['1','true','yes','on'] truthy

```typescript
['1', 'true', 'yes', 'on'].includes(normalizedValue)
// Truthy values
# 1, true, yes, on
# Common conventions
```

### ['0','false','no','off'] falsy

```typescript
['0', 'false', 'no', 'off'].includes(normalizedValue)
// Defined falsy values
# 0, false, no, off
# Explicitly set to false
```

### boolean Return

```typescript
if (typeof envVar === 'boolean') return envVar
// Handle boolean directly
# No normalization needed
# Direct return
```

### memoize getClaudeConfigHomeDir

```typescript
export const getClaudeConfigHomeDir = memoize(
  (): string => {
    return (
      process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')
    ).normalize('NFC')
  },
  () => process.env.CLAUDE_CONFIG_DIR,
)
// Memoize with custom key
# 150+ callers on hot paths
# Keyed off CLAUDE_CONFIG_DIR
# Tests changing env get fresh value
```

### CLAUDE_CONFIG_DIR Key

```typescript
() => process.env.CLAUDE_CONFIG_DIR,
// Custom memoize key
# Cache keyed by env var
# Different env → different result
# Tests can change env
```

### normalize().trim().toLowerCase()

```typescript
envVar.toLowerCase().trim()
// Normalize for comparison
# Case-insensitive
# Trim whitespace
# 'TRUE' → 'true'
```

### hasNodeOption split

```typescript
export function hasNodeOption(flag: string): boolean {
  const nodeOptions = process.env.NODE_OPTIONS
  if (!nodeOptions) {
    return false
  }
  return nodeOptions.split(/\s+/).includes(flag)
}
// Check NODE_OPTIONS flag
# Split on whitespace
# Exact match (no partial)
```

### parseEnvVars KEY=VALUE

```typescript
export function parseEnvVars(
  rawEnvArgs: string[] | undefined,
): Record<string, string> {
  const parsedEnv: Record<string, string> = {}

  if (rawEnvArgs) {
    for (const envStr of rawEnvArgs) {
      const [key, ...valueParts] = envStr.split('=')
      if (!key || valueParts.length === 0) {
        throw new Error(
          `Invalid environment variable format: ${envStr}, should be: -e KEY1=value1`,
        )
      }
      parsedEnv[key] = valueParts.join('=')
    }
  }
  return parsedEnv
}
// Parse KEY=VALUE env vars
# split('=') → [key, ...valueParts]
# valueParts.join('=') handles multiple '='
```

## 实现建议

### OpenClaw适配

1. **envTruthyFalsy**: isEnvTruthy + isEnvDefinedFalsy pattern
2. **truthyFalsyArrays**: ['1','true','yes','on'] + ['0','false','no','off'] pattern
3. **memoizeEnvKey**: memoize with env var key pattern
4. **nodeOptionCheck**: hasNodeOption split pattern
5. **parseEnvVars**: KEY=VALUE parsing pattern

### 状态文件示例

```json
{
  "envVar": "true",
  "isTruthy": true,
  "isDefinedFalsy": false,
  "normalized": "true"
}
```

## 关键模式

### Truthy/Falsy Arrays

```
['1', 'true', 'yes', 'on'] → truthy | ['0', 'false', 'no', 'off'] → defined falsy → standard conventions
# truthy/falsy arrays
# 标准conventions
# case-insensitive
```

### Defined Falsy vs undefined

```
isEnvDefinedFalsy: undefined → false (not defined) | '0' → true (defined false) → different from !isEnvTruthy
# defined falsy vs undefined
# undefined不算defined falsy
# 与!isEnvTruthy不同
```

### Memoize with Env Key

```
memoize(fn, () => process.env.XXX) → key by env var → tests changing env → fresh result
# memoize with env var key
# 测试改变env时fresh result
# 不需要cache.clear
```

### split(/\s+/) Exact Match

```
NODE_OPTIONS.split(/\s+/).includes(flag) → split whitespace → exact match → no partial match
# split whitespace
# exact match
# 防止partial match误判
```

### valueParts.join('=') Multiple '='

```
[key, ...valueParts] = envStr.split('=') → valueParts.join('=') → handles multiple '=' → KEY=a=b=c
# valueParts.join('=')
# 处理多个'='
# KEY=a=b=c → value: a=b=c
```

## 借用价值

- ⭐⭐⭐⭐⭐ isEnvTruthy + isEnvDefinedFalsy pattern
- ⭐⭐⭐⭐⭐ truthy/falsy arrays pattern
- ⭐⭐⭐⭐⭐ Defined falsy vs undefined pattern
- ⭐⭐⭐⭐⭐ Memoize with env key pattern
- ⭐⭐⭐⭐⭐ valueParts.join('=') pattern

## 来源

- Claude Code: `utils/envUtils.ts` (183 lines)
- 分析报告: P55-3