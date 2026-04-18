# Memory Types System Skill

Memory Types System - MEMORY_TYPES 4种 + TYPES_SECTION_COMBINED/INDIVIDUAL + WHAT_NOT_TO_SAVE_SECTION + WHEN_TO_ACCESS_SECTION + TRUSTING_RECALL_SECTION + MEMORY_FRONTMATTER_EXAMPLE。

## 功能概述

从Claude Code的memdir/memoryTypes.ts提取的记忆类型系统，用于OpenClaw的记忆管理。

## 核心机制

### MEMORY_TYPES Enum

```typescript
export const MEMORY_TYPES = [
  'user',
  'feedback',
  'project',
  'reference',
] as const

export type MemoryType = (typeof MEMORY_TYPES)[number]
// 4 discrete memory types
// Constrained to context NOT derivable from code/git
// Each type has specific purpose
```

### Memory Type Descriptions

**user** (always private):
- Information about user's role, goals, responsibilities, knowledge
- Tailor behavior to user preferences
- Examples: data scientist focused on observability, deep Go expertise new to React

**feedback** (default private, team for project-wide conventions):
- Guidance about approach (what to avoid, what to keep doing)
- Record from failure AND success
- Body structure: rule + **Why:** + **How to apply:**
- Examples: integration tests must hit real database, terse responses no trailing summaries

**project** (strongly bias toward team):
- Ongoing work, goals, initiatives, bugs, incidents
- NOT derivable from code or git history
- Convert relative dates to absolute (e.g., "Thursday" → "2026-03-05")
- Body structure: fact/decision + **Why:** + **How to apply:**

**reference** (usually team):
- Pointers to external systems
- Where to find up-to-date information outside project
- Examples: Linear project "INGEST" for pipeline bugs, Grafana dashboard URL

### TYPES_SECTION_COMBINED vs TYPES_SECTION_INDIVIDUAL

```typescript
// COMBINED mode (private + team directories)
export const TYPES_SECTION_COMBINED: readonly string[] = [
  '## Types of memory',
  '',
  'There are several discrete types...',
  '<types>',
  '<type>',
  '    <name>user</name>',
  '    <scope>always private</scope>',
  '    <description>...</description>',
  '    <when_to_save>...</when_to_save>',
  '    <how_to_use>...</how_to_use>',
  '    <examples>...</examples>',
  '</type>',
  // ... more types
  '</types>',
]

// INDIVIDUAL mode (single directory)
export const TYPES_SECTION_INDIVIDUAL: readonly string[] = [
  '## Types of memory',
  // No <scope> tags
  // Plain [saves X memory: ...] format
]
// XML-like tag structure
// <name>, <scope>, <description>, <when_to_save>, <how_to_use>, <examples>
// Combined vs Individual variants
```

### WHAT_NOT_TO_SAVE_SECTION

```typescript
export const WHAT_NOT_TO_SAVE_SECTION: readonly string[] = [
  '## What NOT to save in memory',
  '',
  '- Code patterns, conventions, architecture, file paths, or project structure — can be derived by reading current state.',
  '- Git history, recent changes, or who-changed-what — `git log` / `git blame` are authoritative.',
  '- Debugging solutions or fix recipes — the fix is in the code; the commit message has the context.',
  '- Anything already documented in CLAUDE.md files.',
  '- Ephemeral task details: in-progress work, temporary state, current conversation context.',
  '',
  'These exclusions apply even when the user explicitly asks you to save.',
]
// Exclusion list
// Even explicit requests denied
// Derivable info excluded
```

### WHEN_TO_ACCESS_SECTION

```typescript
export const WHEN_TO_ACCESS_SECTION: readonly string[] = [
  '## When to access memories',
  '- When memories seem relevant, or the user references prior-conversation work.',
  '- You MUST access memory when the user explicitly asks you to check, recall, or remember.',
  '- If the user says to *ignore* or *not use* memory: proceed as if MEMORY.md were empty.',
  MEMORY_DRIFT_CAVEAT,  // Memory records can become stale → verify before answering
]
// Access conditions
// MUST access on explicit request
// Ignore instruction handling
// Stale memory caveat
```

### TRUSTING_RECALL_SECTION

```typescript
export const TRUSTING_RECALL_SECTION: readonly string[] = [
  '## Before recommending from memory',
  '',
  'A memory that names a specific function, file, or flag is a claim that it existed *when the memory was written*.',
  '',
  '- If the memory names a file path: check the file exists.',
  '- If the memory names a function or flag: grep for it.',
  '- If the user is about to act on your recommendation (not just asking about history), verify first.',
  '',
  '"The memory says X exists" is not the same as "X exists now."',
]
// Verify before recommending
// File/function/flag verification
# Historical snapshot caveat
```

### MEMORY_FRONTMATTER_EXAMPLE

```typescript
export const MEMORY_FRONTMATTER_EXAMPLE: readonly string[] = [
  '```markdown',
  '---',
  'name: {{memory name}}',
  'description: {{one-line description — used to decide relevance}}',
  `type: {{user, feedback, project, reference}}`,
  '---',
  '',
  '{{memory content — for feedback/project: rule/fact, then **Why:** and **How to apply:**}}',
  '```',
]
# Frontmatter format
# name + description + type fields
# Content structure guidance
```

## 实现建议

### OpenClaw适配

1. **memoryTypes**: 4种Memory类型
2. **typesSectionCombined**: Combined mode section
3. **whatNotToSave**: Exclusion list
4. **whenToAccess**: Access conditions
5. **trustingRecall**: Verification guidance

### 状态文件示例

```json
{
  "memoryTypes": ["user", "feedback", "project", "reference"],
  "mode": "combined",
  "lastAccess": 1744400000
}
```

## 关键模式

### 4-Type Taxonomy

```
user + feedback + project + reference → constrained types
# 4种类型覆盖所有场景
# 不可从code/git推导的信息
```

### XML-like Tag Structure

```
<types><type><name>...</name><description>...</description></type></types>
# XML-like结构
# 可解析的prompt格式
```

### Derivable Exclusion

```
Code patterns + Git history + Debugging solutions → NOT to save
# 可推导信息排除
# 即使explicit request也拒绝
```

### Stale Memory Caveat

```
Memory records can become stale → verify before answering → trust current state
# 记忆可能过期
# 验证后再回答
# 信任当前状态而非记忆
```

### Body Structure Pattern

```
rule/fact + **Why:** + **How to apply:** → structured feedback/project memories
# 结构化body
# Why解释原因
# How to apply指导应用
```

## 借用价值

- ⭐⭐⭐⭐⭐ Memory type taxonomy (4 types)
- ⭐⭐⭐⭐⭐ WHAT_NOT_TO_SAVE exclusion list
- ⭐⭐⭐⭐⭐ TRUSTING_RECALL verification guidance
- ⭐⭐⭐⭐⭐ XML-like tag structure for prompts
- ⭐⭐⭐⭐⭐ WHEN_TO_ACCESS ignore handling

## 来源

- Claude Code: `memdir/memoryTypes.ts` (225 lines)
- 分析报告: P46-2