---
name: token-budget-tracker
description: |
  Track token consumption per query turn and detect diminishing returns to avoid wasteful continuation.
  
  Use when:
  - Long multi-turn agent tasks
  - Detecting when to stop continuing a task
  - Token budget management for extended operations
  
  Keywords: token budget, diminishing returns, stop condition, continuation, token tracking
metadata:
  openclaw:
    emoji: "📊"
    source: claude-code-query-engine
    triggers: [long-task, token-warning, continuation-check]
    priority: P2
---

# Token Budget Tracker

基于 Claude Code `query/tokenBudget.ts` 的 token 预算追踪，检测无效续写并自动停止。

## 核心逻辑（直接来自 Claude Code）

```typescript
const COMPLETION_THRESHOLD = 0.9   // 90% 预算用完 → 停止
const DIMINISHING_THRESHOLD = 500  // 连续 delta < 500 tokens → 收益递减

type BudgetTracker = {
  continuationCount: number      // 已续写次数
  lastDeltaTokens: number        // 上次 delta token 数
  lastGlobalTurnTokens: number   // 上次全局 token 数
  startedAt: number              // 开始时间戳
}
```

### 决策逻辑

```
checkTokenBudget(tracker, agentId, budget, globalTurnTokens):

1. 如果是 agent 任务 或 无预算 → 直接停止（不追踪）

2. 计算 pct = turnTokens / budget * 100
3. 计算 delta = globalTurnTokens - lastGlobalTurnTokens

4. 检测收益递减:
   isDiminishing = (
     continuationCount >= 3 &&        // 至少续写 3 次
     delta < 500 &&                    // 本次新增 < 500 tokens
     lastDeltaTokens < 500             // 上次也 < 500 tokens
   )

5. 如果 !isDiminishing && turnTokens < budget * 0.9:
   → 继续 (action: 'continue')
   → 发送 nudge 消息提示进度

6. 否则:
   → 停止 (action: 'stop')
   → 记录完成事件（continuationCount, pct, diminishingReturns, durationMs）
```

## OpenClaw 适配实现

### 状态结构

```json
// memory/token-budget-state.json
{
  "sessionId": "2026-04-13-session-1",
  "tracker": {
    "continuationCount": 2,
    "lastDeltaTokens": 1200,
    "lastGlobalTurnTokens": 45000,
    "startedAt": 1713000000000
  },
  "budget": 100000,
  "lastCheck": "2026-04-13T18:30:00+08:00"
}
```

### 使用场景

**长任务中的续写检查**：
```
每次工具调用批次结束后：
1. 估算当前 token 消耗
2. 调用 checkTokenBudget
3. 如果 action = 'stop' → 总结当前进度，停止续写
4. 如果 action = 'continue' → 发送进度提示，继续
```

### Nudge 消息格式（来自 Claude Code）

```
[Token 使用: 45% (45,000/100,000)] 继续执行中...
[Token 使用: 78% (78,000/100,000)] 接近预算上限，加速完成...
[Token 使用: 91% (91,000/100,000)] 已达预算，停止续写
```

### 收益递减检测

当连续 3 次续写每次新增 token < 500 时，说明任务陷入循环或无进展：
```
续写 1: +3200 tokens → 继续
续写 2: +1800 tokens → 继续  
续写 3: +420 tokens  → 警告（delta < 500）
续写 4: +380 tokens  → 停止（连续 2 次 < 500，isDiminishing = true）
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| Token 计数 | 精确（API 返回） | 估算（roughTokenCountEstimation） |
| 触发时机 | 每次 query 迭代 | 每次工具批次结束 |
| 预算来源 | 用户配置 / 模型上下文窗口 | 手动设置或默认 100k |
| 停止行为 | 返回 stop 决策 | 发送飞书通知 + 停止 |
