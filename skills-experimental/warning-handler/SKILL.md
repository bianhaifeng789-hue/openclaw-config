# Warning Handler Skill

**优先级**: P31
**来源**: Claude Code `warningHandler.ts`
**适用场景**: Node.js warning处理

---

## 概述

Warning Handler处理Node.js process warning，抑制内部警告（MaxListenersExceededWarning），bounded map防止内存增长。

---

## 核心功能

### 1. 内部警告抑制

```typescript
const INTERNAL_WARNINGS = [
  /MaxListenersExceededWarning.*AbortSignal/,
  /MaxListenersExceededWarning.*EventTarget/
]

function isInternalWarning(warning: Error): boolean {
  const warningStr = `${warning.name}: ${warning.message}`
  return INTERNAL_WARNINGS.some(pattern => pattern.test(warningStr))
}
```

### 2. Bounded Map

```typescript
const MAX_WARNING_KEYS = 1000
const warningCounts = new Map<string, number>()

warningHandler = (warning: Error) => {
  const warningKey = `${warning.name}: ${warning.message.slice(0, 50)}`
  
  // Bound to prevent unbounded memory growth
  if (warningCounts.has(warningKey) || warningCounts.size < MAX_WARNING_KEYS) {
    warningCounts.set(warningKey, count + 1)
  }
  
  logEvent('tengu_node_warning', {
    is_internal: isInternal ? 1 : 0,
    occurrence_count: count + 1
  })
}
```

---

## OpenClaw应用

### 1. Node Warning处理

```typescript
// 安装warning handler
initializeWarningHandler()

// 抑制常见warning，记录到遥测
```

---

## 状态文件

```json
{
  "skill": "warning-handler",
  "priority": "P31",
  "source": "warningHandler.ts",
  "enabled": true,
  "maxWarningKeys": 1000,
  "internalWarnings": 2,
  "createdAt": "2026-04-12T13:50:00Z"
}
```

---

## 参考

- Claude Code: `warningHandler.ts`