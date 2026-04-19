---
name: mocking-guidelines
description: Guidelines for when and how to mock in tests. Mock at system boundaries only, not internal collaborators. Use when writing tests, deciding to mock, or discussing test strategy.
---

# Mocking Guidelines

## When to Mock

Mock at **system boundaries** only:

- External APIs (Stripe, Twilio, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

## When NOT to Mock

Don't mock:

- ❌ Your own classes/modules
- ❌ Internal collaborators
- ❌ Anything you control

## Designing for Mockability

### 1. Use dependency injection

```typescript
// ✅ Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// ❌ Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

### 2. Prefer SDK-style interfaces

**Good**: Each function is independently mockable

```typescript
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};
```

**Bad**: Mocking requires conditional logic

```typescript
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

## Benefits of SDK-style

- Each mock returns one specific shape
- No conditional logic in test setup
- Easier to see which endpoints a test exercises
- Type safety per endpoint

## Borrowed From

Matt Pocock's tdd/mocking.md.

---

_创建时间: 2026-04-15_