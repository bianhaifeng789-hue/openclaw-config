---
name: dependency-categories
description: Classify module dependencies into 4 categories for architectural decisions. Use when analyzing module dependencies, planning deep modules, or discussing test strategies.
---

# Dependency Categories

From "A Philosophy of Software Design" (John Ousterhout).

## 1. In-process ✅ Always deepenable

Pure computation, in-memory state, no I/O.

**Strategy**: Merge modules directly, test directly.

## 2. Local-substitutable ✅ Deepenable if stand-in exists

Dependencies with local test stand-ins:
- PGLite for Postgres
- In-memory filesystem
- SQLite for MySQL

**Strategy**: Deepen module, test with local stand-in.

## 3. Remote but owned (Ports & Adapters) ✅ Deepenable

Your own services across network boundary (microservices, internal APIs).

**Strategy**:
- Define port (interface) at module boundary
- Deep module owns logic, transport injected
- Tests: in-memory adapter
- Production: HTTP/gRPC/queue adapter

**Recommendation**: "Define shared interface (port), implement HTTP adapter for production and in-memory adapter for testing."

## 4. True external (Mock) ⚠️ Mock at boundary

Third-party services (Stripe, Twilio) you don't control.

**Strategy**:
- Mock at boundary
- Deepened module takes dependency as injected port
- Tests provide mock implementation

## Testing Strategy

**Replace, don't layer**:

- Old unit tests on shallow modules → DELETE once boundary tests exist
- New tests: deepened module's interface boundary
- Assert on observable outcomes, not internal state
- Tests describe behavior, not implementation

## Decision Matrix

| Category | Deepenable? | Test Strategy |
|----------|-------------|---------------|
| In-process | ✅ Always | Direct test |
| Local-substitutable | ✅ If stand-in exists | Stand-in test |
| Ports & Adapters | ✅ Yes | In-memory adapter |
| True external | ⚠️ Mock boundary | Mock implementation |

## Borrowed From

Matt Pocock's improve-codebase-architecture/REFERENCE.md.

---

_创建时间: 2026-04-15_