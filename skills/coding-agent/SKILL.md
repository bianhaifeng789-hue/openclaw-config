---
name: coding-agent
description: |
  Interactive coding assistant with Claude Code integration. Provides TUI-based
  code editing, git operations, AI-powered code review, LSP support, and Vim mode.
  Use when: user wants to edit code with AI assistance, create git commits, review
  code changes, diagnose coding issues, or use Vim motions in the editor.
metadata:
  openclaw:
    emoji: 🤖
    requires:
      bins: [node, git]
      node_modules: [ink, react, @anthropic-ai/sdk, chalk, diff, vscode-languageserver-protocol, vscode-jsonrpc]
---

# Coding Agent Skill

Interactive terminal-based coding assistant powered by Claude Code.

## Features

- **Interactive TUI**: Ink-based React terminal UI for smooth coding experience
- **Smart Git Commits**: AI-generated commit messages based on staged changes
- **Code Review**: Review PRs and code changes with detailed analysis
- **Doctor Command**: Diagnose project and environment issues
- **Enhanced File Editing**: Diff-preview before applying changes
- **LSP Integration**: Language Server Protocol support for TypeScript, Python, Rust
- **Vim Mode**: Full Vim motions and operators support

## Commands

### Start Coding Agent

```bash
npx coding-agent
```

### Git Commit

```bash
/commit
```

Analyzes staged changes and creates a commit with AI-generated message.

### Code Review

```bash
/review [pr-number]
```

Reviews pull requests or current branch changes.

### Doctor

```bash
/doctor
```

Diagnoses environment, dependencies, and common issues.

## Vim Mode

Basic Vim motions and operators are supported:

### Motions
- `h`, `j`, `k`, `l` - Basic movement
- `w`, `b`, `e` - Word movement
- `0`, `^`, `$` - Line movement
- `g`, `G` - File movement

### Operators
- `d` - Delete
- `c` - Change
- `y` - Yank

### Text Objects
- `iw`, `aw` - Inner/around word
- `i"`, `a"` - Inner/around quotes
- `i(`, `a(` - Inner/around parentheses

### Mode Switching
- `i` - Insert mode
- `a` - Append (insert after cursor)
- `v` - Visual mode
- `<Esc>` - Return to normal mode

## Architecture

```
src/
├── index.ts           # Main entry point
├── components/        # Ink TUI components
│   ├── App.tsx       # Root application
│   ├── MessageList.tsx
│   └── Input.tsx
├── commands/          # Slash commands
│   ├── commit.ts
│   ├── review.ts
│   └── doctor.ts
├── tools/            # Enhanced tools
│   └── FileEditTool.ts
├── services/         # Business logic
│   ├── GitService.ts
│   ├── CostTracker.ts
│   └── lsp/          # LSP integration
│       ├── LSPClient.ts
│       ├── LSPServerInstance.ts
│       └── LSPServerManager.ts
├── vim/              # Vim mode implementation
│   ├── types.ts
│   ├── motions.ts
│   ├── operators.ts
│   ├── textObjects.ts
│   └── transitions.ts
└── utils/            # Helpers
    ├── Cursor.ts
    └── diff.ts
```

## Configuration

```yaml
skills:
  coding-agent:
    enabled: true
    anthropic_api_key: ${ANTHROPIC_API_KEY}
    model: claude-sonnet-4-20250514
```

## Key Bindings

- `Ctrl+C` - Exit
- `Ctrl+L` - Clear screen
- `Tab` - Autocomplete
- `↑/↓` - Navigate history

## Development

```bash
cd ~/.openclaw/workspace/skills/coding-agent
npm install
npm run build
npm start
```

## Ported from Claude Code

This skill ports the following Claude Code features:

1. **LSP Integration** - Language server management for multiple languages
2. **FileEditTool** - Enhanced file editing with diff preview
3. **Ink TUI Components** - Terminal UI framework
4. **Vim Mode** - Full Vim motions, operators, and text objects
5. **Cost Tracking** - Token usage tracking and reporting

## License

MIT
