# PRD: OpenClaw Pre-commit Hooks Configuration

## Problem Statement

OpenClaw workspace currently lacks automated quality checks before commits, leading to:
- Inconsistent code formatting across contributors
- Type errors slipping into repository
- Test failures discovered after push
- Manual quality gate enforcement

## Solution

Implement pre-commit hooks using industry-standard tools (Husky + lint-staged + Prettier) to automatically:
1. Format staged files with Prettier before commit
2. Run type checking on TypeScript files
3. Execute test suite for affected code
4. Block commits that fail quality gates

## User Stories

1. As a **developer**, I want **automatic formatting**, so that **code style is consistent without manual effort**.

2. As a **developer**, I want **type errors blocked**, so that **broken code never enters repository**.

3. As a **developer**, I want **fast pre-commit checks**, so that **workflow isn't disrupted**.

4. As a **maintainer**, I want **quality gates enforced**, so that **repository stays healthy**.

5. As a **contributor**, I want **clear error messages**, so that **I can fix issues quickly**.

## Implementation Decisions

### Modules to Build/Modify

1. **Husky Configuration** - Pre-commit hook runner
2. **lint-staged Configuration** - Staged files filtering
3. **Prettier Configuration** - Formatting rules
4. **package.json Scripts** - typecheck, test commands

### Technical Clarifications

- Package manager: npm (package-lock.json exists)
- TypeScript: Yes (impl/**/*.ts files)
- Tests: Jest or native test runner
- Formatting: Standard Prettier config

### Architectural Decisions

- **Fast feedback**: lint-staged runs on staged files only (not all files)
- **Layered checks**: Format → Typecheck → Test (ordered by speed)
- **Graceful failure**: Clear error messages with fix suggestions

### Schema Changes

None - configuration files only.

### API Contracts

None - developer tooling only.

## Testing Decisions

### What Makes a Good Test

- Tests verify hook execution (integration-style)
- Tests should survive refactors (verify behavior, not implementation)
- Manual verification: Commit should fail when checks fail

### Modules to Test

1. `.husky/pre-commit` execution
2. `lint-staged` filtering logic
3. Prettier formatting output

### Prior Art for Tests

- Matt Pocock's setup-pre-commit skill
- Husky v9+ documentation
- lint-staged examples

## Out of Scope

- CI/CD pipeline configuration (future PRD)
- ESLint integration (future PRD)
- Commit message linting (commitlint)
- Branch protection rules

## Further Notes

### Implementation Phases

**Phase 1: Basic Setup**
- Install Husky, lint-staged, Prettier
- Initialize `.husky/` directory
- Create `.husky/pre-commit` hook

**Phase 2: Configuration**
- Create `.lintstagedrc` with Prettier rules
- Create `.prettierrc` with defaults
- Add `prepare` script to package.json

**Phase 3: Verification**
- Test hook execution
- Commit to verify hooks run
- Document in README

### Deep Module Opportunities

**Pre-commit runner** - Encapsulates:
- Package manager detection
- Hook installation
- Error handling
- Cleanup logic

Small interface: `setupPreCommitHooks()`
Large implementation: All detection, installation, verification logic

### Estimated Effort

- Setup: 10 minutes
- Configuration: 5 minutes
- Testing: 5 minutes
- Documentation: 5 minutes
- **Total**: ~25 minutes

### Risk Assessment

- **Low risk**: Standard tooling, well-documented
- **Mitigation**: Use Husky v9+ (no shebang issues)
- **Rollback**: Remove `.husky/` directory if needed

---

_创建时间: 2026-04-15_
_PRD编号: pre-commit-hooks-setup_