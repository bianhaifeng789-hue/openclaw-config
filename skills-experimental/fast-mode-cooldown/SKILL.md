---
name: fast-mode-cooldown
description: "Rate limit cooldown mechanism. Switch to alternative mode when rate limit hit. Track cooldown state with expiration. Auto-recovery after cooldown period. Use when [fast mode cooldown] is needed."
metadata:
  openclaw:
    emoji: "⚡"
    triggers: [rate-limit, cooldown-trigger]
    feishuCard: true
---

# Fast Mode Cooldown Skill - Rate Limit 冷却机制

Rate limit 触发时自动切换模式，冷却期结束后恢复。

## 为什么需要这个？

**场景**：
- Rate limit 达到上限
- 自动切换到备用模式
- 冷却期追踪
- 自动恢复

**Claude Code 方案**：fastMode.ts + cooldown mechanism
**OpenClaw 飞书适配**：冷却状态追踪 + 飞书卡片提示

---

## Cooldown 状态

### 状态类型

```typescript
type FastModeState = 'off' | 'cooldown' | 'on'

interface CooldownInfo {
  state: FastModeState
  triggeredAt: string | null
  expiresAt: string | null
  remainingSeconds: number
  reason: string | null
}
```

### 触发条件

```
• Rate limit reached
• 429 response from API
• Usage quota exceeded
• Manual trigger
```

---

## 冷却期配置

```typescript
interface CooldownConfig {
  durationMinutes: number       // 冷却时长（默认 30 分钟）
  autoRecovery: boolean         // 自动恢复（默认 true）
  notifyOnTrigger: boolean      // 触发时通知（默认 true）
  notifyOnRecovery: boolean     // 恢复时通知（默认 true）
  fallbackMode: string          // 备用模式
}
```

---

## 飞书卡片格式

### Cooldown Trigger 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚡ Fast Mode Cooldown 触发**\n\n**状态变更**：`on` → `cooldown`\n\n**原因**：Rate limit reached\n\n**冷却期**：30 分钟\n\n**恢复时间**：00:33\n\n---\n\n**当前状态**：\n• **触发时间**：00:03\n• **剩余时间**：30 分钟\n• **备用模式**：正常模式\n\n---\n\n**自动恢复后将继续使用快速模式**"
      }
    }
  ]
}
```

### Cooldown Recovery 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**✅ Fast Mode Cooldown 结束**\n\n**状态变更**：`cooldown` → `on`\n\n**冷却期结束**：已恢复正常模式\n\n---\n\n**统计**：\n• **冷却时长**：30 分钟\n• **触发原因**：Rate limit reached\n• **自动恢复**：成功"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 触发 Cooldown

```
Fast Mode Cooldown:
1. 检测 rate limit / 429 response
2. 触发 cooldown 状态变更
3. 发送飞书卡片通知
4. 记录触发时间和原因
5. 启动冷却计时器
```

### 2. 检查冷却状态

```typescript
function getCooldownState(): CooldownInfo {
  const state = readCooldownState()
  
  if (state.state !== 'cooldown') {
    return { state: state.state, ... }
  }
  
  // 计算剩余时间
  const remaining = calculateRemaining(state.expiresAt)
  
  if (remaining <= 0) {
    // 冷却期结束，自动恢复
    recoverFromCooldown()
    return { state: 'on', ... }
  }
  
  return {
    state: 'cooldown',
    remainingSeconds: remaining,
    ...
  }
}
```

### 3. 自动恢复

```typescript
function recoverFromCooldown(): void {
  // 更新状态
  updateCooldownState({ state: 'on', ... })
  
  // 发送恢复通知
  if (config.notifyOnRecovery) {
    sendRecoveryCard()
  }
  
  // 记录统计
  recordCooldownStats()
}
```

---

## 持久化存储

```json
// memory/fast-mode-cooldown-state.json
{
  "state": "off",
  "cooldowns": [
    {
      "triggeredAt": "2026-04-12T00:03:00Z",
      "expiresAt": "2026-04-12T00:33:00Z",
      "reason": "Rate limit reached",
      "recovered": true,
      "recoveredAt": "2026-04-12T00:33:00Z"
    }
  ],
  "stats": {
    "cooldownsTriggered": 0,
    "cooldownsRecovered": 0,
    "totalCooldownMinutes": 0
  },
  "config": {
    "durationMinutes": 30,
    "autoRecovery": true,
    "notifyOnTrigger": true,
    "notifyOnRecovery": true
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| triggerFastModeCooldown | Skill + 状态文件 |
| getFastModeState | getCooldownState |
| Org-level permission check | 飞书用户权限 |
| Extra usage billing | 飞书用量追踪 |
| Terminal notification | 飞书卡片通知 |

---

## 注意事项

1. **冷却时长**：默认 30 分钟，可配置
2. **自动恢复**：冷却期结束自动恢复
3. **飞书卡片**：触发和恢复时发送通知
4. **状态持久化**：记录所有冷却历史
5. **Heartbeat 检查**：每次 heartbeat 检查冷却状态

---

## 自动启用

此 Skill 在 rate limit 或 heartbeat 时自动检查状态。

---

## 下一步增强

- 动态冷却时长（根据 limit 类型）
- 多级冷却（不同 rate limit 不同冷却）
- 冷却期间备用服务切换
- 用量预测（提前预警）