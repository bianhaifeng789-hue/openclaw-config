---
name: sessions-spawn-wrapper
description: "Wrapper for sessions_spawn with subagent limit enforcement. Integrates LRU eviction, resource tracking, and graceful queuing to prevent resource exhaustion. Use when [sessions spawn wrapper] is needed."
---

# Sessions Spawn Wrapper Skill

## Overview

OpenClaw 的 `sessions_spawn` 工具用于创建子 Agent。本 Skill 提供以下增强：

- **并发限制** - 最多 3 个同时运行
- **LRU 淘汰** - 达到限制时淘汰最久未使用的
- **资源追踪** - 记录启动时间、最后使用时间

## Integration

```javascript
// Before spawning, check limit
const limiter = require('./impl/bin/subagent-limiter.js');

// Check if can spawn
if (!limiter.canSpawn()) {
  // Evict LRU or queue
  const evicted = limiter.findLRU();
  if (evicted) {
    limiter.evict(evicted);
    // Send Feishu notification about eviction
  }
}

// Spawn with tracking
const sessionId = generateSessionId();
limiter.spawn(sessionId);

// Actual spawn
sessions_spawn({
  task: "...",
  runtime: "subagent",
  mode: "run",
  ...
});
```

## Hook Integration

Add PreToolUse hook for sessions_spawn:

```json
{
  "event": "PreToolUse",
  "matcher": {
    "toolName": "sessions_spawn"
  },
  "command": "node impl/bin/subagent-limiter.js check",
  "timeout": 3000
}
```

## State Tracking

```json
// state/subagent-limiter-state.json
{
  "active": {
    "session-1": {
      "startedAt": 1776224260000,
      "lastUsed": 1776224260000,
      "task": "analyze DeerFlow"
    }
  },
  "evictions": [
    {
      "sessionId": "session-old",
      "reason": "lru",
      "timestamp": 1776224200000
    }
  ],
  "stats": {
    "totalSpawns": 10,
    "totalEvictions": 2,
    "maxConcurrent": 3
  }
}
```

## Configuration

```yaml
# OpenClaw agent config
agents:
  defaults:
    subagent:
      max_concurrent: 3
      eviction_policy: lru
      timeout_default: 900  # 15 minutes
```

## Feishu Card Format

### Eviction Alert
```json
{
  "elements": [{
    "tag": "div",
    "text": {
      "content": "**⚠️ Subagent 淘汰通知**\n\n已淘汰最久未使用的 Subagent 以释放资源。",
      "tag": "lark_md"
    }
  }]
}
```

## Implementation

See `impl/bin/subagent-limiter.js` for core logic.

## Status

- ✅ Skill documentation created
- ✅ Implementation script exists
- 🔜 Hook integration pending