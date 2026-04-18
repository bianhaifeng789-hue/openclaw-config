# Out-of-Scope Knowledge Base

The `.out-of-scope/` directory stores persistent records of rejected feature requests.

## Purpose

1. **Institutional memory** — why feature was rejected
2. **Deduplication** — avoid re-litigating same requests

## Directory Structure

```
.out-of-scope/
├── dark-mode.md
├── plugin-system.md
└── graphql-api.md
```

One file per **concept**, not per issue.

## File Format

```markdown
# Dark Mode

This project does not support dark mode.

## Why this is out of scope

The rendering pipeline assumes single color palette defined in ThemeConfig. Supporting multiple themes would require:

- Theme context provider
- Per-component theme resolution
- Persistence layer for preferences

This is significant architectural change that doesn't align with project focus on content authoring.

## Prior requests

- #42 — "Add dark mode support"
- #87 — "Night theme for accessibility"
- #134 — "Dark theme option"
```

## Naming the File

Kebab-case concept name: `dark-mode.md`, `plugin-system.md`.

## Writing the Reason

Good reasons reference:

- Project scope/philosophy
- Technical constraints
- Strategic decisions

Avoid temporary circumstances ("we're too busy").

## When to Check `.out-of-scope/`

During triage:

1. Read all `.out-of-scope/` files
2. Check if new request matches existing concept
3. If match, surface to maintainer: "This matches `.out-of-scope/dark-mode.md` — we rejected before because [reason]. Do you still feel the same?"

## When to Write `.out-of-scope/`

Only when **enhancement** (not bug) is rejected as `wontfix`:

1. Maintainer decides feature is out of scope
2. Check if matching file exists
3. If yes: append to "Prior requests"
4. If no: create new file
5. Comment on issue explaining decision
6. Close with `wontfix` label

---

_参考: Matt Pocock github-triage/OUT-OF-SCOPE.md_
_创建时间: 2026-04-15_