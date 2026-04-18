---
name: design-an-interface
description: Generate multiple radically different interface designs using parallel sub-agents. Use when user wants to design an API, explore interface options, or mentions "design it twice".
---

# Design an Interface

Based on "Design It Twice" from "A Philosophy of Software Design": your first idea is unlikely to be the best. Generate multiple radically different designs, then compare.

## Workflow

### 1. Gather Requirements

Ask:
- What problem does this module solve?
- Who are the callers?
- What are the key operations?
- Any constraints?
- What should be hidden vs exposed?

### 2. Generate Designs (Parallel Sub-Agents)

Spawn 3+ sub-agents with **different constraints**:

```
Agent 1: Minimize method count (1-3 methods)
Agent 2: Maximize flexibility
Agent 3: Optimize for most common case
Agent 4: Inspiration from [specific paradigm]
```

Each agent outputs:
1. Interface signature (types/methods)
2. Usage example
3. What it hides internally
4. Trade-offs

### 3. Compare Designs

Compare on:
- Interface simplicity
- General-purpose vs specialized
- Implementation efficiency
- Depth (small interface, big complexity = good)
- Ease of correct use vs misuse

### 4. Synthesize

Ask user:
- "Which best fits your primary use case?"
- "Any elements from other designs?"

## Borrowed From

Matt Pocock's design-an-interface skill.

---

_创建时间: 2026-04-15_