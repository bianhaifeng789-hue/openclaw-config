---
name: tdd-vertical-slices
description: Test-driven development with tracer bullets and vertical slices. Use when user wants to build features using TDD, mentions "red-green-refactor", or asks for test-first development.
---

# TDD - Vertical Slices

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

## Anti-Pattern: Horizontal Slices

❌ **DO NOT write all tests first, then all implementation**

This produces **crap tests**:
- Tests written in bulk test imagined behavior, not actual behavior
- Tests become insensitive to real changes
- You outrun your headlights

## Correct Approach: Vertical Slices

✅ **One test → one implementation → repeat**

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
```

## Workflow

### 1. Planning
- Confirm what interface changes needed
- Confirm which behaviors to test (prioritize)
- Identify opportunities for deep modules
- List behaviors to test (not implementation steps)

### 2. Tracer Bullet
```
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
```

### 3. Incremental Loop
```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules:
- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests

### 4. Refactor
After all tests pass:
- Extract duplication
- Deepen modules
- Run tests after each step

**Never refactor while RED**

## Borrowed From

Matt Pocock's tdd skill for Claude Code.

---

_创建时间: 2026-04-15_