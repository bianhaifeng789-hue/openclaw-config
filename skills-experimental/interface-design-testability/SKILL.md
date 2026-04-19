---
name: interface-design-testability
description: Design interfaces for testability. Accept dependencies, return results, small surface area. Use when designing module interfaces, planning for tests, or discussing testability.
---

# Interface Design for Testability

Good interfaces make testing natural.

## Three Principles

### 1. Accept dependencies, don't create them

```typescript
// ✅ Testable
function processOrder(order, paymentGateway) {
  return paymentGateway.charge(order.total);
}

// ❌ Hard to test
function processOrder(order) {
  const gateway = new StripeGateway(); // Creates dependency
  return gateway.charge(order.total);
}
```

**Why**: Dependencies can be mocked/injected in tests.

### 2. Return results, don't produce side effects

```typescript
// ✅ Testable
function calculateDiscount(cart): Discount {
  return { amount: cart.total * 0.1 };
}

// ❌ Hard to test
function applyDiscount(cart): void {
  cart.total -= discount; // Side effect
}
```

**Why**: Results can be asserted, side effects need verification.

### 3. Small surface area

- **Fewer methods** = fewer tests needed
- **Fewer params** = simpler test setup

## Deep Modules Connection

Small interface + large implementation = deep module.

Deep modules are naturally testable because:
- Interface is small → fewer test cases
- Implementation hidden → can refactor without test changes

## Borrowed From

Matt Pocock's tdd/interface-design.md.

---

_创建时间: 2026-04-15_