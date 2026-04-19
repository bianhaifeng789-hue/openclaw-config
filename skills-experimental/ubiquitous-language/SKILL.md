---
name: ubiquitous-language
description: Extract a DDD-style ubiquitous language glossary from conversation. Use when user wants terminology consistency, mentions DDD, ubiquitous language, or glossary.
---

# Ubiquitous Language

Extract a DDD-style ubiquitous language glossary from the current conversation.

## Process

1. **Scan conversation** for domain terms
2. **Identify key concepts** mentioned repeatedly
3. **Create glossary** with definitions
4. **Save to file** for reference

## Glossary Format

```markdown
# Ubiquitous Language Glossary

## Core Concepts

- **Agent**: An AI assistant that executes tasks and responds to users.
- **Skill**: A capability package with instructions and optional scripts.
- **Middleware**: A processing layer that intercepts tool calls.
- **Guardrails**: Pre-execution authorization checks.

## Domain Terms

- **[Term]**: [Definition from conversation]
```

## Use Cases

- Ensure terminology consistency across team
- Document domain concepts
- Create shared understanding
- Reference for future conversations

## Storage

Save to `workspace/ubiquitous-language.md` or `memory/glossary.md`.

## Borrowed From

Matt Pocock's ubiquitous-language skill.

---

_创建时间: 2026-04-15_