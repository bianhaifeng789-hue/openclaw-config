---
name: prd-to-issues
description: Break a PRD into independently-grabbable GitHub issues using tracer-bullet vertical slices. Use when user wants to convert PRD to issues or create work items.
---

# PRD to Issues

Break a PRD into GitHub issues using vertical slices.

## HITL vs AFK

- **HITL**: Human-in-the-loop (requires decision/review)
- **AFK**: Away-from-keyboard (can implement without interaction)
- Prefer AFK over HITL

## Process

### 1. Locate PRD

Ask for PRD GitHub issue number/URL.

Fetch with `gh issue view <number>`.

### 2. Explore codebase (optional)

Understand current state.

### 3. Draft vertical slices

Each issue is tracer bullet through ALL layers.

Rules:
- Complete path end-to-end
- Demoable on its own
- Many thin slices

### 4. Quiz the user

For each slice:
- **Title**
- **Type**: HITL / AFK
- **Blocked by**: dependencies
- **User stories covered**

Ask:
- Granularity right?
- Dependencies correct?
- HITL/AFK correct?

Iterate until approved.

### 5. Create GitHub issues

Create in dependency order (blockers first).

## Issue Template

```markdown
## Parent PRD

#<prd-issue-number>

## What to build

End-to-end behavior description.

## Acceptance criteria

- [ ] Criterion 1

## Blocked by

- Blocked by #<issue-number>
Or "None - can start immediately"

## User stories addressed

- User story 3
- User story 7
```

## Borrowed From

Matt Pocock's prd-to-issues skill.

---

_创建时间: 2026-04-15_