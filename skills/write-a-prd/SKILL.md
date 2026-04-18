---
name: write-a-prd
description: Create a PRD through user interview, codebase exploration, and module design. Use when user wants to write a PRD, create product requirements, or plan a new feature.
---

# Write a PRD

## Process

### 1. Ask for detailed description
Get a long, detailed description of the problem and potential solutions.

### 2. Explore the repo
Verify assertions and understand current state of codebase.

### 3. Interview relentlessly
Walk down each branch of the design tree, resolving dependencies one-by-one.

### 4. Sketch major modules
Actively look for opportunities to extract **deep modules** (small interface, large implementation).

Check with user:
- Modules match expectations?
- Which modules need tests?

### 5. Write PRD using template

## PRD Template

```markdown
## Problem Statement

The problem from the user's perspective.

## Solution

The solution from the user's perspective.

## User Stories

1. As an <actor>, I want <feature>, so that <benefit>
2. As an <actor>, I want <feature>, so that <benefit>
...

## Implementation Decisions

- Modules to build/modify
- Interfaces to modify
- Technical clarifications
- Architectural decisions
- Schema changes
- API contracts

DO NOT include file paths or code snippets.

## Testing Decisions

- What makes a good test
- Which modules will be tested
- Prior art for tests

## Out of Scope

Things outside this PRD scope.

## Further Notes

Any additional notes.
```

## Deep Modules

A deep module encapsulates a lot of functionality in a simple, testable interface which rarely changes.

## Borrowed From

Matt Pocock's write-a-prd skill.

---

_创建时间: 2026-04-15_