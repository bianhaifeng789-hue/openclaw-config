---
name: skill-description-guide
description: Guide for writing skill descriptions that agents can correctly trigger. Description is the ONLY thing agent sees. Use when creating, updating, or reviewing skill descriptions.
---

# Skill Description Guide

## Critical Understanding

**The description is the ONLY thing your agent sees** when deciding which skill to load.

It's surfaced in the system prompt alongside all other installed skills. Your agent reads these descriptions and picks the relevant skill based on the user's request.

## Goal

Give your agent just enough info to know:

1. **What capability** this skill provides
2. **When/why to trigger** it (specific keywords, contexts, file types)

## Format Requirements

- **Max 1024 chars**
- **Third person** (not "I will", but "This skill...")
- **First sentence**: what it does
- **Second sentence**: "Use when [specific triggers]"

## Good Examples

```
Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when user mentions PDFs, forms, or document extraction.
```

```
Test-driven development with red-green-refactor loop. Use when user wants to build features or fix bugs using TDD, mentions "red-green-refactor", wants integration tests, or asks for test-first development.
```

```
Triage GitHub issues through label-based state machine with interactive grilling. Use when user wants to triage issues, review bugs, prepare issues for AFK agent, or manage issue workflow.
```

## Bad Examples

```
Helps with documents.
```

Problem: No way to distinguish from other document skills.

```
A skill for testing.
```

Problem: Too generic, no triggers.

```
I will help you write tests.
```

Problem: First person, not third person.

## Trigger Patterns

Common trigger patterns:

- File types: `.pdf`, `.json`, `.yaml`
- Keywords: "triage", "PRD", "TDD", "refactor"
- Actions: "create", "migrate", "setup"
- Contexts: "when user mentions", "working with"

## Borrowed From

Matt Pocock's write-a-skill/SKILL.md.

---

_创建时间: 2026-04-15_