---
name: subagent-limit
description: "Middleware for limiting concurrent subagent executions. Prevents resource exhaustion by enforcing max concurrent subagents (default: 3), queuing new requests when limit reached, and evicting least-recently-used when needed. Use when [subagent limit] is needed."
---

# Subagent Limit Skill

## Overview

**Problem**: Unlimited subagents can exhaust resources.

**Solution**:
- **Max concurrent limit** (default: 3)
- **LRU eviction** when limit reached
- **Graceful queuing** for new requests

## Configuration

```yaml
subagents:
  max_concurrent: 3
  eviction_policy: lru  # least-recently-used

  agents:
    general-purpose:
      timeout_seconds: 1800
    bash:
      timeout_seconds: 300
```

## Limit Enforcement

```javascript
class SubagentLimiter {
  constructor(maxConcurrent = 3) {
    this.active = new Map();  // id -> {startedAt, lastUsed}
    this.max = maxConcurrent;
  }

  canSpawn() {
    return this.active.size < this.max;
  }

  spawn(id) {
    if (this.canSpawn()) {
      this.active.set(id, {
        startedAt: Date.now(),
        lastUsed: Date.now()
      });
      return true;
    }

    // Evict LRU
    const lru = this.findLRU();
    if (lru) {
      this.evict(lru);
      this.active.set(id, {startedAt: Date.now(), lastUsed: Date.now()});
      return true;
    }

    return false;  // Cannot spawn
  }

  findLRU() {
    let oldest = null;
    let oldestTime = Infinity;

    for (const [id, meta] of this.active) {
      if (meta.lastUsed < oldestTime) {
        oldestTime = meta.lastUsed;
        oldest = id;
      }
    }

    return oldest;
  }
}
```

## Integration Points

1. **spawn_subagent** - Check limit before spawn
2. **Track usage** - Update lastUsed on activity
3. **Eviction notification** - Warn when evicted

## Implementation Script

See `impl/bin/subagent-limiter.js` for Node.js implementation.

## OpenClaw Integration

Integrates with:
- Session spawn control
- Resource management
- Background task tracking

## Status

- ✅ Skill documentation created
- 🔜 Implementation script pending