---
name: request-refactor-plan
description: Create detailed refactor plan with tiny commits via user interview, then file as GitHub issue. Use when user wants to plan refactor, create refactoring RFC, or break refactor into safe steps.
---

# Request Refactor Plan

Create refactor plan with **tiny commits** (Martin Fowler: "make each refactoring step as small as possible").

## Process

### 1. Ask for detailed description

Get problem and potential solutions.

### 2. Explore repo

Verify assertions, understand current state.

### 3. Consider other options

Present alternatives to user.

### 4. Interview implementation

Be extremely detailed and thorough.

### 5. Hammer out exact scope

What to change, what NOT to change.

### 6. Check test coverage

If insufficient, ask user's testing plans.

### 7. Break into tiny commits

Each commit leaves codebase in working state.

### 8. Create GitHub issue

## Refactor Plan Template

```markdown
## Problem Statement

Problem from developer's perspective.

## Solution

Solution from developer's perspective.

## Commits

LONG implementation plan in plain English.

Break into tiniest commits possible.

Each commit = working state.

## Decision Document

- Modules to modify
- Interfaces to modify
- Technical clarifications
- Architectural decisions
- Schema changes

DO NOT include file paths.

## Testing Decisions

- What makes good test
- Which modules tested
- Prior art

## Out of Scope

Things outside this refactor.

## Further Notes

Additional notes.
```

## Martin Fowler Philosophy

"Make each refactoring step as small as possible, so that you can always see the program working."

## Borrowed From

Matt Pocock's request-refactor-plan skill.

---

_创建时间: 2026-04-15_