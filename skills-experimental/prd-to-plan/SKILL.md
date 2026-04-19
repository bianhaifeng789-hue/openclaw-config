---
name: prd-to-plan
description: Turn a PRD into multi-phase implementation plan using tracer-bullet vertical slices. Use when user wants to break down a PRD, create implementation plan, or mentions "tracer bullets".
---

# PRD to Plan

Break a PRD into phased implementation plan using vertical slices. Output: `./plans/<feature>.md`

## Process

### 1. Confirm PRD in context

PRD should already be in conversation. If not, ask user to paste it.

### 2. Explore codebase

Understand current architecture, patterns, integration layers.

### 3. Identify durable architectural decisions

High-level decisions unlikely to change:
- Route structures
- Database schema
- Key data models
- Auth approach
- Service boundaries

### 4. Draft vertical slices

**Tracer bullet** phases - thin vertical slice through ALL layers (schema, API, UI, tests).

Rules:
- Each slice delivers COMPLETE path end-to-end
- Completed slice is demoable on its own
- Prefer many thin slices over few thick
- DO NOT include file names/implementation details
- DO include durable decisions: routes, schema, models

### 5. Quiz the user

Present numbered list. For each phase:
- **Title**
- **User stories covered**

Ask:
- Granularity right?
- Merge/split phases?

Iterate until approved.

### 6. Write plan file

Create `./plans/<feature>.md` with template.

## Plan Template

```markdown
# Plan: <Feature>

> Source PRD: <identifier>

## Architectural decisions

- **Routes**: ...
- **Schema**: ...

---

## Phase 1: <Title>

**User stories**: <list>

### What to build

End-to-end behavior description.

### Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

## Borrowed From

Matt Pocock's prd-to-plan skill.

---

_创建时间: 2026-04-15_