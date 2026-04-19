---
name: improve-architecture
description: Explore codebase for architectural improvement opportunities, focusing on deepening shallow modules. Use when user wants to improve architecture, find refactoring opportunities, or make codebase more testable.
---

# Improve Codebase Architecture

Explore codebase like an AI would, surface friction, propose deepening refactors as GitHub issues.

## Deep Modules

**Deep module** (John Ousterhout): small interface, large implementation. More testable, more AI-navigable.

**Shallow module**: interface nearly as complex as implementation.

## Process

### 1. Explore the codebase

Navigate organically. Note friction:
- Where understanding requires bouncing between many files?
- Where modules are so shallow?
- Where pure functions extracted just for testability?
- Where tightly-coupled modules create integration risk?
- Which parts are untested/hard to test?

### 2. Present candidates

Show numbered list of deepening opportunities:
- **Cluster**: Modules involved
- **Why they're coupled**
- **Dependency category**
- **Test impact**

Ask: "Which would you like to explore?"

### 3. Frame the problem space

Write user-facing explanation:
- Constraints new interface must satisfy
- Dependencies it relies on
- Rough code sketch

### 4. Design multiple interfaces

Spawn 3+ sub-agents with **different constraints**:

```
Agent 1: Minimize interface (1-3 entry points)
Agent 2: Maximize flexibility
Agent 3: Optimize for most common caller
Agent 4: Ports & adapters pattern
```

Each outputs:
1. Interface signature
2. Usage example
3. What it hides
4. Dependency strategy
5. Trade-offs

Present sequentially, compare in prose.

Give **opinionated recommendation**.

### 5. Create GitHub issue

Create refactor RFC immediately using `gh issue create`.

## Borrowed From

Matt Pocock's improve-codebase-architecture skill.

---

_创建时间: 2026-04-15_