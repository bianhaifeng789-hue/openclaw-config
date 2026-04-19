---
name: shell-completion
description: "Shell completion cache. setupShellCompletion + detectShell (zsh/bash/fish) + regenerateCompletionCache + Shell completion scripts + ~/.claude/completion.{zsh/bash/fish}. Use when [shell completion] is needed."
metadata:
  openclaw:
    emoji: "⌨️"
    triggers: [shell-completion, completion-setup]
    feishuCard: true
---

# Shell Completion Skill - Shell Completion

Shell Completion Shell 补全缓存工具。

## 为什么需要这个？

**场景**：
- Setup shell completion
- Detect shell（zsh/bash/fish）
- Regenerate completion cache
- Completion scripts
- Shell RC file update

**Claude Code 方案**：completionCache.ts + 170+ lines
**OpenClaw 飞书适配**：Shell completion + Completion cache

---

## Shell Detection

```typescript
function detectShell(): ShellInfo | null {
  const shell = process.env.SHELL || ''
  const home = homedir()
  const claudeDir = join(home, '.claude')

  if (shell.endsWith('/zsh')) {
    const cacheFile = join(claudeDir, 'completion.zsh')
    return {
      name: 'zsh',
      rcFile: join(home, '.zshrc'),
      cacheFile,
      completionLine: `[[ -f "${cacheFile}" ]] && source "${cacheFile}"`,
      shellFlag: 'zsh',
    }
  }
  if (shell.endsWith('/bash')) {
    // ...
  }
  if (shell.endsWith('/fish')) {
    // ...
  }
  return null
}
```

---

## Functions

### 1. Setup Shell Completion

```typescript
async function setupShellCompletion(theme: ThemeName): Promise<string> {
  const shell = detectShell()
  if (!shell) return ''

  // Ensure cache directory
  await mkdir(dirname(shell.cacheFile), { recursive: true })

  // Generate completion script
  const result = await execFileNoThrow(claudeBin, [
    'completion',
    shell.shellFlag,
    '--output',
    shell.cacheFile,
  ])

  // Check if rc file already sources completions
  const existing = await readFile(shell.rcFile, 'utf-8')
  if (existing.includes(shell.cacheFile)) {
    return 'Shell completions updated'
  }

  // Append source line to rc file
  await writeFile(shell.rcFile, `${existing}\n${shell.completionLine}\n`)
  return 'Installed shell completions'
}
```

### 2. Regenerate Completion cache

```typescript
async function regenerateCompletionCache(): Promise<void> {
  const shell = detectShell()
  if (!shell) return

  await execFileNoThrow(claudeBin, [
    'completion',
    shell.shellFlag,
    '--output',
    shell.cacheFile,
  ])
}
```

---

## Completion Files

| Shell | Cache File | RC File |
|-------|-----------|---------|
| zsh | ~/.claude/completion.zsh | ~/.zshrc |
| bash | ~/.claude/completion.bash | ~/.bashrc |
| fish | ~/.claude/completion.fish | ~/.config/fish/config.fish |

---

## 飞书卡片格式

### Shell Completion 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⌨️ Shell Completion**\n\n---\n\n**Shells**：\n• zsh - ~/.zshrc\n• bash - ~/.bashrc\n• fish - ~/.config/fish/config.fish\n\n---\n\n**Cache Files**：\n• ~/.claude/completion.zsh\n• ~/.claude/completion.bash\n• ~/.claude/completion.fish\n\n---\n\n**Functions**：\n• setupShellCompletion() - Setup\n• detectShell() - Detect\n• regenerateCompletionCache() - Regenerate"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/shell-completion-state.json
{
  "shell": null,
  "stats": {
    "totalSetups": 0
  },
  "lastUpdate": "2026-04-12T11:02:00Z",
  "notes": "Shell Completion Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| completionCache.ts (170+ lines) | Skill + Completion |
| setupShellCompletion() | Setup |
| detectShell() | Shell detection |
| completion cache | ~/.claude/completion.* |

---

## 注意事项

1. **Shell detection**：SHELL env var
2. **RC file update**：Append source line
3. **Cache file**：~/.claude/completion.*
4. **Regenerate**：After `claude update`
5. **Hyperlinks**：pathToFileURL support

---

## 自动启用

此 Skill 在 shell completion 时自动运行。

---

## 下一步增强

- 飞书 completion 集成
- Completion analytics
- Completion debugging