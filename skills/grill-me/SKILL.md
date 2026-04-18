---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

# Grill Me

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

## Process

For each question:
1. Ask **one question at a time**
2. Provide your **recommended answer**
3. If question can be answered by exploring codebase, **explore codebase instead**
4. Continue until all branches resolved

## Questions Template

```
Q1: What is the core problem this solves?
Recommended: [Your analysis]

Q2: Who are the primary users/callers?
Recommended: [Your analysis]

Q3: What are the key operations?
Recommended: [Your analysis]

Q4: What constraints exist?
Recommended: [Your analysis]

Q5: What should be hidden vs exposed?
Recommended: [Your analysis]
```

## Borrowed From

Matt Pocock's grill-me skill for Claude Code.

---

_创建时间: 2026-04-15_