# Singleton Activity Manager Skill

Singleton Activity Manager - ActivityManager + getInstance singleton + resetInstance + startCLIActivity + endCLIActivity + activeOperations Set + isCLIActive flag + user vs CLI time + USER_ACTIVITY_TIMEOUT + dedup operationId + trackOperation async wrapper + getActiveTimeCounter。

## 功能概述

从Claude Code的utils/activityManager.ts提取的Singleton activity manager模式，用于OpenClaw的活动时间追踪。

## 核心机制

### ActivityManager Class

```typescript
export class ActivityManager {
  private activeOperations = new Set<string>()
  private lastUserActivityTime: number = 0
  private lastCLIRecordedTime: number
  private isCLIActive: boolean = false
  private readonly USER_ACTIVITY_TIMEOUT_MS = 5000
  // Track user and CLI activity separately
  // Deduplicate overlapping operations
}
```

### getInstance Singleton

```typescript
private static instance: ActivityManager | null = null

static getInstance(): ActivityManager {
  if (!ActivityManager.instance) {
    ActivityManager.instance = new ActivityManager()
  }
  return ActivityManager.instance
}
// Singleton pattern
# Lazy initialization
# Global instance
```

### resetInstance

```typescript
static resetInstance(): void {
  ActivityManager.instance = null
}
// Reset singleton (for testing)
# Allows re-initialization
```

### startCLIActivity

```typescript
startCLIActivity(operationId: string): void {
  // If operation already exists, force cleanup to avoid overestimating
  if (this.activeOperations.has(operationId)) {
    this.endCLIActivity(operationId)
  }

  const wasEmpty = this.activeOperations.size === 0
  this.activeOperations.add(operationId)

  if (wasEmpty) {
    this.isCLIActive = true
    this.lastCLIRecordedTime = this.getNow()
  }
}
// Start tracking CLI operation
# Dedup existing operationId
# Set isCLIActive on first
```

### endCLIActivity

```typescript
endCLIActivity(operationId: string): void {
  this.activeOperations.delete(operationId)

  if (this.activeOperations.size === 0) {
    // Last operation ended - CLI becoming inactive
    const now = this.getNow()
    const timeSinceLastRecord = (now - this.lastCLIRecordedTime) / 1000

    if (timeSinceLastRecord > 0) {
      const activeTimeCounter = this.getActiveTimeCounter()
      if (activeTimeCounter) {
        activeTimeCounter.add(timeSinceLastRecord, { type: 'cli' })
      }
    }

    this.isCLIActive = false
  }
}
// End tracking CLI operation
# Record time on last operation end
# Set isCLIActive false
```

### activeOperations Set

```typescript
private activeOperations = new Set<string>()
// Set of active operation IDs
# Dedup by operationId
# Track concurrent operations
```

### isCLIActive Flag

```typescript
private isCLIActive: boolean = false
// CLI active status
# Prevents user activity recording during CLI
# CLI takes precedence
```

### user vs CLI Time

```typescript
// Don't record user time if CLI is active (CLI takes precedence)
if (!this.isCLIActive && this.lastUserActivityTime !== 0) {
  // Record user time
}
// Separate metrics for user vs CLI
# CLI active: no user recording
```

### USER_ACTIVITY_TIMEOUT

```typescript
private readonly USER_ACTIVITY_TIMEOUT_MS = 5000 // 5 seconds
// Only record time if within the timeout window
if (timeSinceLastActivity < timeoutSeconds) {
  activeTimeCounter.add(timeSinceLastActivity, { type: 'user' })
}
// 5 second timeout window
# Timeout: ignore old activity
```

### dedup operationId

```typescript
if (this.activeOperations.has(operationId)) {
  this.endCLIActivity(operationId)  // Force cleanup
}
// Deduplicate overlapping operations
# Better underestimate than overestimate
```

### trackOperation Async Wrapper

```typescript
async trackOperation<T>(operationId: string, fn: () => Promise<T>): Promise<T> {
  this.startCLIActivity(operationId)
  try {
    return await fn()
  } finally {
    this.endCLIActivity(operationId)
  }
}
// Convenience method for async operations
# Automatic start/end
# try/finally ensures cleanup
```

### getActiveTimeCounter

```typescript
private readonly getActiveTimeCounter: typeof getActiveTimeCounterImpl
// Counter for active time metrics
# Injected dependency
# Allows testing
```

## 实现建议

### OpenClaw适配

1. **singletonActivity**: getInstance singleton
2. **cliActivity**: startCLIActivity + endCLIActivity
3. **activeOperationsSet**: activeOperations Set pattern
4. **userVsCLI**: user vs CLI time separation
5. **trackOperation**: trackOperation async wrapper

### 状态文件示例

```json
{
  "activeOperations": ["op1", "op2"],
  "isCLIActive": true,
  "userTimeout": 5000
}
```

## 关键模式

### Singleton Lazy Init

```
instance = null → getInstance() → if (!instance) instance = new → lazy init
# singleton lazy initialization
# getInstance检查null
# null则new instance
```

### Set Active Operations

```
Set<string> → operationId → has → end → add → dedup → concurrent tracking
# Set tracking active operations
# operationId dedup
# concurrent operations
```

### CLI Precedence over User

```
isCLIActive → true → no user recording → CLI takes precedence → separate metrics
# CLI active时不记录user time
# CLI优先级高于user
# 独立metrics
```

### Timeout Window Filter

```
timeSinceLastActivity < 5s → record | > 5s → ignore → timeout filter
# 5秒timeout window
# 超过timeout不记录
# 过滤旧activity
```

### try/finally Cleanup

```
startCLIActivity → try { fn() } → finally { endCLIActivity } → guaranteed cleanup
# try/finally确保cleanup
# 即使fn抛异常也end
# guaranteed cleanup
```

## 借用价值

- ⭐⭐⭐⭐⭐ Singleton getInstance pattern
- ⭐⭐⭐⭐⭐ activeOperations Set dedup pattern
- ⭐⭐⭐⭐⭐ CLI precedence over user pattern
- ⭐⭐⭐⭐⭐ USER_ACTIVITY_TIMEOUT filter
- ⭐⭐⭐⭐⭐ trackOperation async wrapper

## 来源

- Claude Code: `utils/activityManager.ts` (164 lines)
- 分析报告: P53-3