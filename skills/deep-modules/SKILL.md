---
name: deep-modules
description: Deep module = small interface + large implementation. The key architectural concept from John Ousterhout's "A Philosophy of Software Design". Use when designing interfaces, planning refactors, or discussing architecture.
---

# Deep Modules

From "A Philosophy of Software Design" (John Ousterhout).

## Definition

**Deep module** = Small interface + Large implementation

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
│                     │
└─────────────────────┘
```

**Shallow module** = Large interface + Little implementation (AVOID)

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
```

## Design Questions

When designing interfaces:

1. **Can I reduce the number of methods?**
2. **Can I simplify the parameters?**
3. **Can I hide more complexity inside?**

## Benefits

- ✅ Easier to test (small interface)
- ✅ Easier to navigate (simple surface)
- ✅ More resilient to change (complexity hidden)
- ✅ Better encapsulation

## Anti-Patterns

- ❌ Interface nearly as complex as implementation
- ❌ Pure functions extracted just for testability
- ❌ Pass-through modules (thin wrappers)

## Examples

**Good (Deep)**:
- File system API: open/read/write/close (4 methods, massive complexity inside)
- HTTP client: get/post (2 methods, handles retries, auth, encoding internally)

**Bad (Shallow)**:
- Wrapper that just calls another module with same params
- Module with 20 methods each doing trivial work

## Borrowed From

Matt Pocock's tdd/deep-modules.md reference.

---

_创建时间: 2026-04-15_