---
name: triage-issue
description: Triage a bug by exploring codebase to find root cause, then create GitHub issue with TDD fix plan. Use when user reports a bug, wants to file an issue, or mentions "triage".
---

# Triage Issue

Investigate a problem, find root cause, create GitHub issue with TDD fix plan.

**Mostly hands-off workflow - minimize questions to the user.**

## Process

### 1. Capture the problem

Ask ONE question: "What's the problem you're seeing?"

Do NOT ask follow-up questions yet. Start investigating immediately.

### 2. Explore and diagnose

Use Agent tool to investigate. Find:
- **Where** the bug manifests
- **What** code path is involved
- **Why** it fails (root cause)
- **What** related code exists

Look at:
- Related source files
- Existing tests
- Recent changes (git log)
- Similar patterns elsewhere

### 3. Identify fix approach

- Minimal change needed
- Which modules affected
- What behaviors need tests
- Is this regression, missing feature, or design flaw?

### 4. Design TDD fix plan

Create RED-GREEN cycles:

```
1. RED: Write test that [describes expected behavior]
   GREEN: [Minimal change to make it pass]

2. RED: Write test that [describes next behavior]
   GREEN: [Minimal change to make it pass]
```

Rules:
- Tests verify behavior through public interfaces
- One test at a time, vertical slices
- Describe behaviors, not implementation

### 5. Create GitHub issue

Create immediately using `gh issue create`. Do NOT ask user to review before creating.

## Issue Template

```markdown
## Problem

- What happens (actual)
- What should happen (expected)
- How to reproduce

## Root Cause Analysis

- Code path involved
- Why current code fails
- Contributing factors

DO NOT include file paths/line numbers.

## TDD Fix Plan

1. RED: Write test that [behavior]
   GREEN: [minimal change]

2. RED: Write test that [behavior]
   GREEN: [minimal change]

REFACTOR: [cleanup needed]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] All new tests pass
- [ ] Existing tests pass
```

## Borrowed From

Matt Pocock's triage-issue skill.

---

_创建时间: 2026-04-15_