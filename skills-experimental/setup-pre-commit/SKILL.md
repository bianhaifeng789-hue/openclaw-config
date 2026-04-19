---
name: setup-pre-commit
description: Set up Husky pre-commit hooks with lint-staged, Prettier, typecheck, and tests. Use when user wants to add pre-commit hooks, set up Husky, or configure commit-time checks.
---

# Setup Pre-Commit Hooks

## What This Sets Up

- **Husky** pre-commit hook
- **lint-staged** running Prettier on staged files
- **typecheck** and **test** scripts

## Process

### 1. Detect package manager

Check for:
- `package-lock.json` → npm
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `bun.lockb` → bun

Default to npm if unclear.

### 2. Install dependencies

```bash
<pm> install -D husky lint-staged prettier
```

### 3. Initialize Husky

```bash
npx husky init
```

Creates `.husky/` dir and adds `prepare: "husky"`.

### 4. Create `.husky/pre-commit`

```
npx lint-staged
<pm> run typecheck
<pm> run test
```

**Adapt**: Replace `<pm>` with detected package manager. Omit typecheck/test if scripts don't exist.

### 5. Create `.lintstagedrc`

```json
{
  "*": "prettier --ignore-unknown --write"
}
```

### 6. Create `.prettierrc` (if missing)

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "printWidth": 80,
  "singleQuote": false,
  "trailingComma": "es5",
  "semi": true,
  "arrowParens": "always"
}
```

### 7. Verify checklist

- [ ] `.husky/pre-commit` exists
- [ ] `.lintstagedrc` exists
- [ ] `prepare` script in package.json
- [ ] prettier config exists
- [ ] Run `npx lint-staged` works

### 8. Commit

Stage all files, commit: `Add pre-commit hooks (husky + lint-staged + prettier)`

## Notes

- Husky v9+ doesn't need shebangs
- `prettier --ignore-unknown` skips unparsable files
- Pre-commit: lint-staged (fast) → typecheck → test

## Borrowed From

Matt Pocock's setup-pre-commit skill.

---

_创建时间: 2026-04-15_