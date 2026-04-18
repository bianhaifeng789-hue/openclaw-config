---
name: testing-philosophy
description: Core philosophy on good vs bad tests. Tests should verify behavior through public interfaces, not implementation details. Use when discussing testing strategy, reviewing tests, or creating test guidelines.
---

# Testing Philosophy

## Good Tests ✅

**Integration-style**: Test through real interfaces, not mocks.

```typescript
// GOOD: Tests observable behavior
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

### Characteristics

- Tests behavior users/callers care about
- Uses public API only
- **Survives internal refactors** ← Key!
- Describes WHAT, not HOW
- One logical assertion per test

## Bad Tests ❌

**Implementation-detail tests**: Coupled to internal structure.

```typescript
// BAD: Tests implementation details
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

### Red Flags 🚩

- Mocking internal collaborators
- Testing private methods
- Asserting on call counts/order
- Test breaks when refactoring **without behavior change**
- Test name describes HOW not WHAT
- Verifying through external means instead of interface

### Example: Bad vs Good

```typescript
// ❌ BAD: Bypasses interface to verify
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// ✅ GOOD: Verifies through interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

## Core Principle

**Tests Should Survive Refactors**

If you can change the implementation entirely without changing tests → Good.

If tests break when implementation changes but behavior stays same → Bad.

## Borrowed From

Matt Pocock's tdd/tests.md reference.

---

_创建时间: 2026-04-15_