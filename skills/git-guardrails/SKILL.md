---
name: git-guardrails
description: Block dangerous git commands before execution. Use when user wants git safety, mentions dangerous git operations, or to prevent accidental pushes.
---

# Git Guardrails

Block dangerous git commands before they execute.

## Blocked Commands

```json
[
  "git push --force",
  "git push -f",
  "git reset --hard",
  "git clean -fd",
  "git clean -fx",
  "git checkout --",
  "git stash clear",
  "git branch -D",
  "git tag -d"
]
```

## Rules

- Pre-tool-use check for `exec` commands
- If command matches blocked pattern → DENY
- Return error message to agent

## Implementation

**Script**: Check before `exec` with git commands:
```bash
node impl/bin/guardrails-provider.js evaluate exec "git push --force"
```

**Result**: `{ allow: false, reason: "Command contains blocked pattern: 'git push --force'" }`

## Configuration

Add to `state/guardrails-config.json`:
```json
{
  "blocked_patterns": [
    "git push --force",
    "git reset --hard",
    "git clean -fd"
  ]
}
```

## Borrowed From

Matt Pocock's git-guardrails-claude-code skill.

---

_创建时间: 2026-04-15_