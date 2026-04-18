---
name: environment-utils
description: "Environment utilities. getClaudeConfigHomeDir memoize + isEnvTruthy 4 values (1/true/yes/on) + isEnvDefinedFalsy 4 values (0/false/no/off) + isBareMode + parseEnvVars KEY=VALUE + getAWSRegion. Use when [environment utils] is needed."
metadata:
  openclaw:
    emoji: "🌐"
    triggers: [env-check, config-load]
    feishuCard: true
---

# Environment Utils Skill - Environment Utils

Environment Utils 环境变量工具。

## 为什么需要这个？

**场景**：
- Config home directory
- Truthy/falsy check
- Env var parsing
- Bare mode check
- AWS region

**Claude Code 方案**：envUtils.ts + 184+ lines
**OpenClaw 飞书适配**：Environment utils + Truthy check

---

## Functions

### 1. Get Claude Config Home

```typescript
const getClaudeConfigHomeDir = memoize(
  (): string => {
    return (
      process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude')
    ).normalize('NFC')
  },
  () => process.env.CLAUDE_CONFIG_DIR,
)
```

### 2. Is Env Truthy

```typescript
function isEnvTruthy(envVar: string | boolean | undefined): boolean {
  if (!envVar) return false
  if (typeof envVar === 'boolean') return envVar
  const normalizedValue = envVar.toLowerCase().trim()
  return ['1', 'true', 'yes', 'on'].includes(normalizedValue)
}
```

### 3. Is Env Defined Falsy

```typescript
function isEnvDefinedFalsy(envVar: string | boolean | undefined): boolean {
  if (envVar === undefined) return false
  if (typeof envVar === 'boolean') return !envVar
  if (!envVar) return false
  const normalizedValue = envVar.toLowerCase().trim()
  return ['0', 'false', 'no', 'off'].includes(normalizedValue)
}
```

### 4. Is Bare Mode

```typescript
function isBareMode(): boolean {
  return (
    isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE) ||
    process.argv.includes('--bare')
  )
}
```

### 5. Parse Env Vars

```typescript
function parseEnvVars(rawEnvArgs: string[]): Record<string, string> {
  const parsedEnv: Record<string, string> = {}
  for (const envStr of rawEnvArgs) {
    const [key, ...valueParts] = envStr.split('=')
    if (!key || valueParts.length === 0) {
      throw new Error(`Invalid format: ${envStr}`)
    }
    parsedEnv[key] = valueParts.join('=')
  }
  return parsedEnv
}
```

---

## Truthy/Falsy Values

| Truthy | Falsy |
|--------|-------|
| 1 | 0 |
| true | false |
| yes | no |
| on | off |

---

## 飞书卡片格式

### Environment Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🌐 Environment Utils**\n\n---\n\n**Truthy Values**：1/true/yes/on\n**Falsy Values**：0/false/no/off\n\n---\n\n**Functions**：\n• getClaudeConfigHomeDir() - Config home\n• isEnvTruthy() - Truthy check\n• isEnvDefinedFalsy() - Falsy check\n• isBareMode() - Bare mode\n• parseEnvVars() - Parse KEY=VALUE\n\n---\n\n**Bare Mode**：\n• --bare flag\n• CLAUDE_CODE_SIMPLE\n• 30+ gates"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/environment-utils-state.json
{
  "configHome": "~/.claude",
  "truthyValues": ["1", "true", "yes", "on"],
  "falsyValues": ["0", "false", "no", "off"],
  "stats": {
    "totalChecks": 0
  },
  "lastUpdate": "2026-04-12T02:00:00Z",
  "notes": "Environment Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| envUtils.ts (184+ lines) | Skill + Env |
| isEnvTruthy() | 4 truthy values |
| isEnvDefinedFalsy() | 4 falsy values |
| getClaudeConfigHomeDir() | Memoize |

---

## 注意事项

1. **4 truthy values**：1/true/yes/on
2. **4 falsy values**：0/false/no/off
3. **Memoize**：Config home cached
4. **Bare mode**：30+ gates
5. **Parse KEY=VALUE**：Env var parsing

---

## 自动启用

此 Skill 在 env check 时自动运行。

---

## 下一步增强

- 飞书 env 集成
- Env analytics
- Env debugging