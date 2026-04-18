---
name: xdg-base-directory
description: "XDG Base Directory utilities for cross-platform dirs. getXDGStateHome (~/.local/state) + getXDGCacheHome (~/.cache) + getXDGDataHome (~/.local/share) + getUserBinDir (~/.local/bin) + Env var override (XDG_STATE_HOME/XDG_CACHE_HOME/XDG_DATA_HOME). Use when [xdg base directory] is needed."
metadata:
  openclaw:
    emoji: "📁"
    triggers: [xdg-check, directory-check]
    feishuCard: true
---

# XDG Base Directory Skill - XDG Base Directory

XDG Base Directory 跨平台目录工具。

## 为什么需要这个？

**场景**：
- Cross-platform directories
- State/cache/data directories
- Env var override
- Native installer components
- XDG spec compliance

**Claude Code 方案**：xdg.ts + 80+ lines
**OpenClaw 飞书适配**：XDG Base Directory + Cross-platform dirs

---

## XDG Specification

- **XDG_STATE_HOME**: ~/.local/state (default)
- **XDG_CACHE_HOME**: ~/.cache (default)
- **XDG_DATA_HOME**: ~/.local/share (default)
- **User bin**: ~/.local/bin

---

## Functions

### 1. Get XDG State Home

```typescript
function getXDGStateHome(options?: XDGOptions): string {
  const { env, home } = resolveOptions(options)
  return env.XDG_STATE_HOME ?? join(home, '.local', 'state')
}
```

### 2. Get XDG Cache Home

```typescript
function getXDGCacheHome(options?: XDGOptions): string {
  const { env, home } = resolveOptions(options)
  return env.XDG_CACHE_HOME ?? join(home, '.cache')
}
```

### 3. Get XDG Data Home

```typescript
function getXDGDataHome(options?: XDGOptions): string {
  const { env, home } = resolveOptions(options)
  return env.XDG_DATA_HOME ?? join(home, '.local', 'share')
}
```

### 4. Get User Bin Dir

```typescript
function getUserBinDir(options?: XDGOptions): string {
  const { home } = resolveOptions(options)
  return join(home, '.local', 'bin')
}
```

---

## Env Variables

| Env Var | Default |
|---------|---------|
| XDG_STATE_HOME | ~/.local/state |
| XDG_CACHE_HOME | ~/.cache |
| XDG_DATA_HOME | ~/.local/share |

---

## 飞书卡片格式

### XDG Base Directory 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📁 XDG Base Directory**\n\n---\n\n**Directories**：\n• getXDGStateHome() → ~/.local/state\n• getXDGCacheHome() → ~/.cache\n• getXDGDataHome() → ~/.local/share\n• getUserBinDir() → ~/.local/bin\n\n---\n\n**Env Override**：\n• XDG_STATE_HOME\n• XDG_CACHE_HOME\n• XDG_DATA_HOME\n\n---\n\n**XDG Spec**：https://specifications.freedesktop.org/basedir-spec/latest/"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/xdg-base-directory-state.json
{
  "directories": {
    "stateHome": "~/.local/state",
    "cacheHome": "~/.cache",
    "dataHome": "~/.local/share",
    "binDir": "~/.local/bin"
  },
  "lastUpdate": "2026-04-12T10:52:00Z",
  "notes": "XDG Base Directory Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| xdg.ts (80+ lines) | Skill + XDG |
| getXDGStateHome() | State dir |
| getXDGCacheHome() | Cache dir |
| Env override | XDG_*_HOME |

---

## 注意事项

1. **XDG spec**：Freedesktop standard
2. **Env override**：XDG_*_HOME
3. **Default paths**：~/.local/state, ~/.cache, ~/.local/share
4. **Testing**：options.env/homedir override
5. **User bin**：Not technically XDG

---

## 自动启用

此 Skill 在 directory check 时自动运行。

---

## 下一步增强

- 飞书 XDG 集成
- XDG analytics
- XDG debugging