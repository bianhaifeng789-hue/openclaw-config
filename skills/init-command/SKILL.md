# Init Command Skill

项目初始化命令 - 多阶段交互式CLAUDE.md/skills/hooks设置。

## 功能概述

从Claude Code的init.ts提取的项目初始化模式，用于OpenClaw的项目配置。

## 核心机制

### Phase结构（7阶段）

```
Phase 1: Ask what to set up（AskUserQuestion选项）
Phase 2: Explore the codebase（subagent survey）
Phase 3: Fill in the gaps（AskUserQuestion gap-fill）
Phase 4: Write CLAUDE.md（project）
Phase 5: Write CLAUDE.local.md（personal）
Phase 6: Set up hooks（PostToolUse等）
Phase 7: Set up skills（/skill-name）
```

### Phase 1 Options

```typescript
AskUserQuestion([
  {
    question: "Which CLAUDE.md files should /init set up?",
    options: ["Project CLAUDE.md", "Personal CLAUDE.local.md", "Both"]
  },
  {
    question: "Also set up skills and hooks?",
    options: ["Skills + hooks", "Skills only", "Hooks only", "Neither"]
  }
])
```

### Phase 2 Survey

Launch subagent to read:
- Manifest files (package.json, Cargo.toml, pyproject.toml, go.mod, pom.xml)
- README, Makefile, CI config
- Existing CLAUDE.md, .claude/rules/, AGENTS.md
- Cursor/Copilot/Windsurf/Cline rules
- Formatter config (prettier, biome, ruff, black, gofmt, rustfmt)
- Git worktree status

### Phase 3 Gap-fill

Ask only things code can't answer:
- Non-obvious commands, gotchas, branch/PR conventions
- User role, familiarity, sandbox URLs
- Communication preferences

### Artifact Type Decision

```
Hook（strict）→ deterministic shell on tool event，Claude can't skip
Skill（on-demand）→ /skill-name invocation
CLAUDE.md note（loose）→ influences behavior，not enforced
```

**Respect Phase 1 choice as hard filter**

### Preview Field

```typescript
AskUserQuestion({
  question: "Does this proposal look right?",
  options: [
    { label: "Looks good", preview: "• Format-on-edit hook..." },
    { label: "Drop the hook", preview: "• /verify skill..." }
  ]
})
// preview renders markdown in side-panel
```

### CLAUDE.md内容规则

**Include**:
- Build/test/lint commands Claude can't guess
- Code style rules that DIFFER from defaults
- Testing instructions and quirks
- Repo etiquette (branch naming, PR conventions)
- Required env vars or setup steps
- Non-obvious gotchas

**Exclude**:
- File-by-file structure（discoverable）
- Standard conventions（known）
- Generic advice
- Long tutorials（use @path/to/import）

### @import Syntax

```markdown
@docs/api-reference.md
// Inline content on demand without bloating CLAUDE.md
```

## 实现建议

### OpenClaw适配

1. **场景**: 项目初始化设置
2. **交互**: AskUserQuestion多阶段
3. **survey**: subagent探索代码库
4. **artifact**: 根据用户选择创建

### 状态文件示例

```json
{
  "phase": 4,
  "choice": {
    "claudeMd": "both",
    "skillsHooks": "skills + hooks"
  },
  "artifacts": ["CLAUDE.md", "CLAUDE.local.md", ".claude/skills/verify.md"]
}
```

## 关键模式

### Preference Queue

```typescript
{type: hook|skill|note, description, target file, details}
// Phases 4-7 consume this queue
```

### Preview Side-panel

`preview` field renders markdown：
- question: short plain text
- preview: markdown in side-panel
- Options stay short

### Hard Filter

Phase 1 choice constrains Phase 3 proposal：
- "Skills only" → hooks downgraded to skill/note
- "Hooks only" → skills downgraded to hook/note
- "Neither" → all become notes

## 借用价值

- ⭐⭐⭐⭐⭐ 多阶段交互设计
- ⭐⭐⭐⭐⭐ Artifact type决策逻辑
- ⭐⭐⭐⭐⭐ Preview field模式
- ⭐⭐⭐⭐ @import语法减少bloat

## 来源

- Claude Code: `commands/init.ts` (20KB)
- 分析报告: P35-1