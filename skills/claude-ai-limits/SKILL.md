---
name: claude-ai-limits
description: "Claude AI 使用量限制追踪系统，5h/7d 限额 + Early Warning Use when [claude ai limits] is needed."
version: 1.0.0
phase: 11
priority: high
source: Claude Code services/claudeAiLimits.ts (16KB)
borrowed_patterns:
  - checkEarlyWarning
  - getRateLimitErrorMessage
  - getRateLimitWarning
  - processRateLimitHeaders
  - extractRawUtilization
---

# Claude AI Limits - 使用量限制追踪

## 功能概述

借鉴 Claude Code 的 Limits 系统，实现使用量追踪：
- 5 小时 / 7 天限额追踪
- Early Warning 系统（提前预警）
- Rate limit 消息生成
- Overage 状态管理

## 核心模式

### 1. processRateLimitHeaders - 处理响应头

```typescript
// 从 API 响应头提取利用率
const limits = processRateLimitHeaders(response.headers)

// 返回格式
{
  status: 'allowed' | 'allowed_warning' | 'rejected',
  rateLimitType: 'five_hour' | 'seven_day',
  utilization: 0.45, // 0-1 fraction
  resetsAt: 1703275200, // unix epoch seconds
  surpassedThreshold: 0.9
}
```

### 2. checkEarlyWarning - 提前预警

```typescript
// 检查是否触发 Early Warning
const hasWarning = checkEarlyWarning(
  utilization,   // 0.9 (90%)
  resetsAt,      // 重置时间
  'five_hour'    // 限制类型
)

// 触发条件:
// - 5h: utilization >= 90% 且 time <= 72%
// - 7d: utilization >= 75% 且 time <= 60%
```

### 3. 消息生成

```typescript
// 错误消息（耗尽）
getRateLimitErrorMessage(limits)
// "❌ **会话限制已耗尽**..."

// 警告消息（接近耗尽）
getRateLimitWarning(limits)
// "⚠️ **会话限制接近耗尽**..."
```

## 飞书集成

### 接入 API 调用

```typescript
import { createLimitsHook } from './claude-ai-limits'

const hook = createLimitsHook()

// API 调用前检查
const { shouldAbort, message } = hook.beforeApiCall()
if (shouldAbort) {
  // 发送飞书错误卡片
  message({ action: 'send', message })
  return
}

// API 调用后处理
const { warning } = hook.afterApiCall({ headers: response.headers })
if (warning) {
  // 发送飞书警告卡片
  message({ action: 'send', card: { title: '使用量警告', content: warning } })
}
```

### 飞书卡片格式

```
❌ **会话限制已耗尽**

重置时间: 4月14日 08:30
✅ 可以使用 Overage（额外用量）
继续使用将消耗额外配额。
```

## 状态文件

位置: `memory/limits-state.json`

```json
{
  "currentLimits": {
    "status": "allowed",
    "utilization": 0.45,
    "resetsAt": 1703275200
  },
  "rawUtilization": {
    "fiveHour": { "utilization": 0.45, "resetsAt": 1703275200 },
    "sevenDay": { "utilization": 0.23, "resetsAt": 1703606400 }
  },
  "warningCount": 2,
  "rejectedCount": 0
}
```

## Early Warning 算法

### 5 小时限制

| 条件 | 阈值 |
|------|------|
| utilization >= | 90% |
| time elapsed <= | 72% |

触发: 使用 90% 但时间才过去不到 72% → 使用过快

### 7 天限制

| utilization | time elapsed |
|-------------|--------------|
| >= 75% | <= 60% |
| >= 50% | <= 35% |
| >= 25% | <= 15% |

分级预警，防止突然耗尽

## 使用场景

### 1. API 响应处理

```
Anthropic API 返回 headers:
  anthropic-ratelimit-unified-5h-utilization: 0.92
  anthropic-ratelimit-unified-5h-reset: 1703275200

→ processRateLimitHeaders()
→ status: 'allowed_warning'
→ 发送飞书警告卡片
```

### 2. 提前预警

```
用户: 开始一个大型重构任务

系统检查:
  5h utilization: 85%
  time elapsed: 50%
  
→ checkEarlyWarning(0.85, ..., 'five_hour') = false
  
继续执行（还有时间）
```

### 3. 限制耗尽

```
用户: 继续对话

系统检查:
  5h utilization: 100%
  
→ status: 'rejected'
→ getRateLimitErrorMessage()
→ 阻止 API 调用，发送飞书错误卡片
```

## 与 OpenClaw 集成

### HEARTBEAT.md 添加检查

```yaml
- name: limits-check
  interval: 30m
  prompt: "Check limits-state.json. If status === 'allowed_warning', send Feishu card with warning message. If status === 'rejected', send error card."
```

### impl/utils/index.ts 添加入口

```typescript
export * as limits from './claude-ai-limits'

// 用法
import { limits } from './impl/utils'
limits.checkQuotaStatus()
limits.getRateLimitWarning(currentLimits)
```

## 性能指标

| 操作 | 预期耗时 | Ops/sec |
|------|---------|---------|
| processRateLimitHeaders | < 1ms | 1M+ |
| checkEarlyWarning | < 0.1ms | 10M+ |
| getRateLimitErrorMessage | < 1ms | 1M+ |
| extractRawUtilization | < 0.5ms | 2M+ |

## 与 Claude Code 对比

| 功能 | Claude Code | OpenClaw | 状态 |
|------|-------------|----------|------|
| processRateLimitHeaders | ✅ | ✅ | ✅ |
| checkEarlyWarning | ✅ | ✅ | ✅ |
| 5h/7d tracking | ✅ | ✅ | ✅ |
| Overage handling | ✅ | ✅ | ⚠️ 模拟 |
| testQuery | API call | mock | ⚠️ |
| growthbook gates | ✅ | - | ❌ |

## 关键差距

### 实际 API 调用

**Claude Code**:
- 实际调用 `makeTestQuery()` 检查配额
- 连接 Anthropic API 获取真实利用率

**OpenClaw 当前**:
- 模拟返回（需要接入 OpenClaw API client）
- 需要从实际 API 响应头提取数据

### Growthbook Gates

**Claude Code**:
- `checkStatsigFeatureGate_CACHED_MAY_BE_STALE()` gates
- Feature flags 控制 Early Warning

**OpenClaw**:
- 无 Growthbook/Statsig 集成
- 简化实现

## 下一步

1. 接入 OpenClaw Anthropic API client
2. 从实际响应头提取利用率
3. 飞书卡片显示实时使用量
4. 添加用户设置（警告阈值调整）

---

生成时间: 2026-04-13 20:35
状态: Phase 11 实现完成 ✅