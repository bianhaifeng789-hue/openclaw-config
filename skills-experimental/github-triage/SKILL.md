---
name: github-triage
description: Triage GitHub issues through label-based state machine with interactive grilling sessions. Use when user wants to triage issues, review incoming bugs, prepare issues for AFK agent, or manage issue workflow.
---

# GitHub Issue Triage

Triage issues using label-based state machine.

## Labels

| Label             | Type     | Description                              |
| ----------------- | -------- | ---------------------------------------- |
| `bug`             | Category | Something is broken                      |
| `enhancement`     | Category | New feature or improvement               |
| `needs-triage`    | State    | Maintainer needs to evaluate             |
| `needs-info`      | State    | Waiting for reporter info                |
| `ready-for-agent` | State    | Fully specified, ready for AFK agent     |
| `ready-for-human` | State    | Requires human implementation            |
| `wontfix`         | State    | Will not be actioned                     |

**Rule**: Exactly one state + one category label.

## State Machine

| Current State  | Can transition to | Who triggers        |
| -------------- | ----------------- | ------------------- |
| `unlabeled`    | `needs-triage`    | Skill (first look)  |
| `unlabeled`    | `ready-for-agent` | Maintainer          |
| `unlabeled`    | `ready-for-human` | Maintainer          |
| `unlabeled`    | `wontfix`         | Maintainer          |
| `needs-triage` | `needs-info`      | Maintainer          |
| `needs-triage` | `ready-for-agent` | Maintainer          |
| `needs-triage` | `ready-for-human` | Maintainer          |
| `needs-triage` | `wontfix`         | Maintainer          |
| `needs-info`   | `needs-triage`    | Skill (detects reply) |

## Invocation Examples

- "Show me anything that needs my attention"
- "Let's look at #42"
- "Move #42 to ready-for-agent"
- "What's ready for agents to pick up?"

## Workflow: Show What Needs Attention

When asked "what needs attention":

1. Query issues with `needs-triage` label
2. Present each issue with recommendation
3. Maintainer chooses next state

## Agent Brief (for ready-for-agent)

See AGENT-BRIEF.md for writing agent briefs.

**Key principles**:
- Durability over precision (no file paths)
- Behavioral, not procedural (WHAT not HOW)
- Complete acceptance criteria
- Explicit scope boundaries

## Out-of-Scope Knowledge Base

See OUT-OF-SCOPE.md for rejected feature tracking.

`.out-of-scope/` directory stores:
- Why feature was rejected
- Prior requests referencing it
- Reasoning for future reference

## Borrowed From

Matt Pocock's github-triage skill.

---

_创建时间: 2026-04-15_