---
name: refactoring-patterns
description: Identify refactor candidates after TDD cycle. Duplication, long methods, shallow modules, feature envy. Use when refactoring code, looking for improvement opportunities, or after TDD cycle.
---

# Refactoring Patterns

After TDD cycle, look for these refactor candidates.

## Pattern List

### 1. Duplication → Extract function/class

Same logic in multiple places? Extract it.

### 2. Long methods → Break into private helpers

Keep tests on public interface, extract private helpers.

### 3. Shallow modules → Combine or deepen

Shallow module = large interface + little implementation.

Combine with related module or deepen (smaller interface).

### 4. Feature envy → Move logic to where data lives

Method uses another object's data more than its own?

Move the method to that object.

### 5. Primitive obsession → Introduce value objects

Using primitives (string, number) where domain objects make sense?

Create value objects (Money, DateRange, Email).

### 6. Existing code revealed as problematic

New code often reveals problems in old code.

Don't ignore it - fix it.

## Refactor Rules

- ✅ Run tests after each refactor step
- ✅ Keep tests on public interface
- ❌ Never refactor while RED
- ✅ Get to GREEN first

## Borrowed From

Matt Pocock's tdd/refactoring.md.

---

_创建时间: 2026-04-15_