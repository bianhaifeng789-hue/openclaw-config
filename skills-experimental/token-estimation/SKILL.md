---
name: token-estimation
description: "精确 token 估算系统，支持混合语言、工具调用估算 Use when [token estimation] is needed."
version: 1.0.0
phase: 12
priority: high
source: Claude Code services/tokenEstimation.ts (17KB)
borrowed_patterns:
  - estimateTextTokens
  - estimateMessagesTokens
  - estimateToolsTokens
  - calculateBudget
---

# Token Estimation - Token 估算系统

## 功能概述

借鉴 Claude Code 的 Token Estimation 系统：
- 精确 token 估算（混合语言支持）
- 工具定义估算
- Context budget 追踪
- 预算警告生成

## 核心模式

### 1. estimateTextTokens - 文本估算

```typescript
// 混合语言估算
estimateTextTokens("你好，Hello world")
// 自动检测语言类型，应用不同规则

// 语言规则
- 英文: ~4 chars/token
- 中文: ~1.5 chars/token
- 代码: ~3 chars/token
- 混合: ~2.5 chars/token
```

### 2. estimateMessagesTokens - 消息估算

```typescript
// 估算对话消息
estimateMessagesTokens([
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '你好！有什么可以帮你？' }
])

// 返回: 基础 tokens + 消息 overhead + 内容 tokens
```

### 3. calculateBudget - 预算计算

```typescript
// 计算剩余 context
const budget = calculateBudget(usedTokens, 200000)

// 返回
{
  total: 200000,
  used: 45000,
  remaining: 155000,
  percentage: 22
}
```

## 飞书集成

### 接入消息生成

```typescript
import { createTokenEstimationHook } from './token-estimation-service'

const hook = createTokenEstimationHook()

// 发送消息前估算
const { estimation, budget, warning } = hook.beforeMessage({
  systemPrompt,
  messages,
  tools
})

// 如果有警告，发送飞书卡片
if (warning) {
  message({ action: 'send', card: { title: 'Token 预算', content: warning } })
}
```

### 飞书卡片格式

```
⚠️ **Context 接近上限**
已使用 75%（150,000 tokens）
建议触发 compact 或减少对话长度
```

## 状态文件

位置: `memory/token-estimation-state.json`

```json
{
  "lastEstimation": {
    "totalTokens": 45000,
    "inputTokens": 30000,
    "outputTokens": 15000,
    "breakdown": {
      "systemPrompt": 500,
      "messages": 28000,
      "tools": 1500
    }
  }
}
```

## 使用场景

### 1. Context Budget 追踪

```
每条消息发送前:
  estimateTokens() → 输入 tokens
  calculateBudget() → 剩余 context
  
显示飞书卡片: "Context: 45% (90,000/200,000)"
```

### 2. Compact 触发判断

```
if (budget.percentage >= 75) {
  // 触发 compact
  sessionMemoryCompact.compactMemoryContent()
  
  // 发送飞书通知
  message({ action: 'send', message: '已触发自动 compact' })
}
```

### 3. 成本估算

```
估算 tokens → 查询价格表 → 显示成本
"预计消耗: ~$0.15 (30K input + 15K output)"
```

## 与 OpenClaw 集成

### HEARTBEAT.md 添加检查

```yaml
- name: token-budget-check
  interval: on-event
  prompt: "After each message, check token budget. If > 75%, send Feishu warning card"
```

### impl/utils/index.ts 添加入口

```typescript
export * as tokens from './token-estimation-service'

// 用法
import { tokens } from './impl/utils'
tokens.estimateTextTokens(text)
tokens.calculateBudget(used)
```

## 性能指标

| 操作 | 预期耗时 | Ops/sec |
|------|---------|---------|
| estimateTextTokens | < 0.5ms | 2M+ |
| estimateMessagesTokens | < 2ms | 500K+ |
| estimateToolsTokens | < 1ms | 1M+ |
| calculateBudget | < 0.01ms | 100M+ |

---

生成时间: 2026-04-13 20:40
状态: Phase 12 实现完成 ✅