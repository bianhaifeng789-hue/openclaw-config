# Writing Agent Briefs

An agent brief is a structured comment posted on a GitHub issue when it moves to `ready-for-agent`. It is the authoritative specification that an AFK agent will work from.

## Principles

### 1. Durability over precision

The issue may sit in `ready-for-agent` for days or weeks. The codebase will change.

- ✅ Describe interfaces, types, behavioral contracts
- ✅ Name specific types, function signatures
- ❌ Reference file paths — they go stale
- ❌ Reference line numbers
- ❌ Assume current implementation structure

### 2. Behavioral, not procedural

Describe **what** the system should do, not **how** to implement it.

**Good**: "The `SkillConfig` type should accept an optional `schedule` field of type `CronExpression`"

**Bad**: "Open src/types/skill.ts and add a schedule field on line 42"

### 3. Complete acceptance criteria

Every agent brief must have concrete, testable acceptance criteria.

**Good**: "Running `gh issue list --label needs-triage` returns issues that have been through initial classification"

**Bad**: "Triage should work correctly"

### 4. Explicit scope boundaries

State what is out of scope.

## Template

```markdown
## Agent Brief

**Category:** bug / enhancement
**Summary:** one-line description

**Current behavior:**
What happens now.

**Desired behavior:**
What should happen after.

**Key interfaces:**
- `TypeName` — what needs to change
- `functionName()` return type

**Acceptance criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Out of scope:**
- Thing that should NOT be changed
```

## Example (Bug)

```markdown
## Agent Brief

**Category:** bug
**Summary:** Skill description truncation drops mid-word

**Current behavior:**
When description exceeds 1024 characters, it truncates at exactly 1024 regardless of word boundaries.

**Desired behavior:**
Truncation should break at last word boundary before 1024 chars and append "..."

**Key interfaces:**
- `SkillMetadata` type's `description` field

**Acceptance criteria:**
- [ ] Descriptions under 1024 chars unchanged
- [ ] Descriptions over 1024 chars truncated at word boundary
- [ ] Truncated descriptions end with "..."
- [ ] Total length including "..." ≤ 1024 chars

**Out of scope:**
- Changing 1024 char limit
- Multi-line descriptions
```

---

_参考: Matt Pocock github-triage/AGENT-BRIEF.md_
_创建时间: 2026-04-15_