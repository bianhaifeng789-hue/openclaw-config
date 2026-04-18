# Plan: OpenClaw Pre-commit Hooks

> Source PRD: pre-commit-hooks-prd.md

## Architectural Decisions

- **Package Manager**: npm (package-lock.json likely)
- **Hook Runner**: Husky v9+ (no shebangs needed)
- **Staged Filter**: lint-staged (fast, only staged files)
- **Formatter**: Prettier (standard, ignore-unknown)
- **Typecheck**: TypeScript (impl/**/*.ts)
- **Tests**: Jest or npm test (if available)

---

## Phase 1: Basic Setup & Package Manager Detection

**User stories**: 1 (consistent formatting), 5 (clear error messages)

### What to build

Tracer bullet: Install Husky, detect package manager, create `.husky/` directory, add `prepare` script to package.json.

End-to-end behavior:
- Developer installs dependencies → Husky initializes
- `.husky/` directory created
- `prepare: "husky"` script added
- Package manager detected (npm/pnpm/yarn/bun)

### Acceptance criteria

- [ ] Husky installed as devDependency
- [ ] `.husky/` directory exists
- [ ] `prepare` script in package.json (if exists)
- [ ] Package manager correctly detected
- [ ] Can run `npx husky init` successfully

---

## Phase 2: Pre-commit Hook & lint-staged

**User stories**: 1 (consistent formatting), 3 (fast feedback)

### What to build

Tracer bullet: Create `.husky/pre-commit` with lint-staged + typecheck + test, create `.lintstagedrc` configuration.

End-to-end behavior:
- Developer commits → lint-staged runs Prettier on staged files
- Typecheck runs on TypeScript files
- Tests run (if available)
- Commit blocked if any check fails

### Acceptance criteria

- [ ] `.husky/pre-commit` file exists
- [ ] `.lintstagedrc` with `{"*": "prettier --ignore-unknown --write"}`
- [ ] lint-staged runs on commit
- [ ] Commit fails if staged files have formatting issues
- [ ] Error messages are clear

---

## Phase 3: Prettier Configuration & Verification

**User stories**: 2 (type errors blocked), 4 (quality gates)

### What to build

Tracer bullet: Create `.prettierrc` (if missing), verify entire flow by committing changes, document in README.

End-to-end behavior:
- Developer commits code → all checks pass → commit succeeds
- Prettier config enforces consistent style
- README documents pre-commit hooks

### Acceptance criteria

- [ ] `.prettierrc` exists (if missing before)
- [ ] Full flow tested: commit → checks → success
- [ ] README updated with pre-commit hooks section
- [ ] All acceptance criteria from Phases 1-2 still pass

---

## Implementation Notes

### Dependencies to Install

```bash
<package-manager> install -D husky lint-staged prettier
```

### File Structure After Completion

```
.husky/
  pre-commit         # Hook script
.lintstagedrc        # lint-staged config
.prettierrc          # Prettier config (if missing)
package.json         # prepare script added (if exists)
```

### Vertical Slice principle

Each phase is a **tracer bullet** - thin but complete path through all layers:
- Phase 1: Setup → Verification
- Phase 2: Hook → Test
- Phase 3: Config → Document

---

_创建时间: 2026-04-15_