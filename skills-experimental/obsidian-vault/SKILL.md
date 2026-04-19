---
name: obsidian-vault
description: Search, create, and manage notes in Obsidian vault using wikilinks and index notes. Use when user wants to manage Obsidian notes, create wikilinks, or organize knowledge base.
---

# Obsidian Vault Management

## Philosophy

**Flat structure + Links** - No folders, use wikilinks and index notes.

## Naming Conventions

- **Title Case** for all note names
- **Index notes**: aggregate related topics (e.g., `Skills Index.md`)
- No folders - use links instead

## Wikilinks

- Syntax: `[[Note Title]]`
- Add related links at note bottom
- Index notes = lists of `[[wikilinks]]`

## Workflows

### Search notes

```bash
# By filename
find /vault/path -name "*.md" | grep -i "keyword"

# By content
grep -rl "keyword" /vault/path --include="*.md"
```

### Create note

1. Title Case filename
2. Write as unit of learning
3. Add `[[wikilinks]]` to related notes at bottom
4. Hierarchical numbering if in sequence

### Find backlinks

```bash
grep -rl "\\[\\[Note Title\\]\\]" /vault/path
```

### Find index notes

```bash
find /vault/path -name "*Index*"
```

## Borrowed From

Matt Pocock's obsidian-vault skill.

---

_创建时间: 2026-04-15_