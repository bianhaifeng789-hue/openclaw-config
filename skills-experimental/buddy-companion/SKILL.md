---
name: buddy-companion
description: "虚拟伙伴系统，游戏化用户体验 Use when [buddy companion] is needed."
version: 1.0.0
phase: 13
priority: high
source: Claude Code buddy/ (6 files, 70KB)
borrowed_patterns:
  - generateBuddy
  - rollRarity
  - rollStats
  - mulberry32 PRNG
  - BuddyNotification
---

# Buddy Companion - 虚拟伙伴系统

## 功能概述

借鉴 Claude Code 的 Buddy 系统，实现游戏化体验：
- 虚拟伙伴生成（基于用户 hash）
- 稀有度系统（Common → Legendary）
- 6 项属性系统
- 互动追踪 + 通知

## 核心模式

### 1. generateBuddy - 生成伙伴

```typescript
// 根据用户生成确定性 Buddy
const buddy = generateBuddy('user-ou_xxx')

// 返回格式
{
  id: 'buddy-user-ou_xxx-1703275200',
  name: '鸭子·王者',  // Legendary 有后缀
  species: 'duck',
  rarity: 'legendary',
  stats: {
    wisdom: 95,      // 峰值属性
    courage: 12,     // 低谷属性
    charisma: 67,
    intelligence: 72,
    creativity: 58,
    luck: 45
  },
  hat: 'wizard',
  eyes: 'cool',
  interactionCount: 0
}
```

### 2. 稀有度系统

| 稀有度 | 权重 | 属性下限 | Emoji |
|--------|------|---------|-------|
| Common | 60% | 5 | ⚪ |
| Uncommon | 25% | 15 | 🟢 |
| Rare | 10% | 25 | 🔵 |
| Epic | 4% | 35 | 🟣 |
| Legendary | 1% | 50 | 🟡 |

### 3. 属性生成规则

- **峰值属性**: floor + 50 + random(30) → 通常是最高值
- **低谷属性**: floor - 10 + random(15) → 通常是最低值
- **其他属性**: floor + random(40)

## 飞书集成

### 接入消息处理

```typescript
import { createBuddyHook } from './buddy-companion-service'

const hook = createBuddyHook()

// 会话开始
const { buddy, notification, card } = hook.onSessionStart(userId)

// 发送 Buddy 卡片
if (notification) {
  message({
    action: 'send',
    card: { title: '你的伙伴', content: card }
  })
}
```

### 飞书卡片格式

```
🟡 **鸭子·王者**
稀有度: 传奇
种类: 鸭子

智慧: ██████████ 95
勇气: █░░░░░░░░░ 12
魅力: ██████░░░░ 67
智力: ███████░░░ 72
创造力: █████░░░░░ 58
运气: ████░░░░░░ 45

互动次数: 23
```

## 状态文件

位置: `memory/buddy-state.json`

```json
{
  "currentBuddy": {
    "id": "buddy-ou_xxx-1703275200",
    "name": "鸭子",
    "rarity": "uncommon",
    "interactionCount": 23
  },
  "buddies": [...],
  "totalInteractions": 23
}
```

## 使用场景

### 1. 会话开始欢迎

```
用户开始会话:
  → generateBuddy(userId)
  → 发送飞书卡片: "🟢 你的伙伴: 猫咪"
  → 显示属性条形图
```

### 2. 互动里程碑

```
每 50 次互动:
  → shouldNotify() 检测里程碑
  → 发送飞书通知: "🎉 猫咪达成 50 次互动！"
```

### 3. Idle 提醒

```
30 分钟无互动:
  → shouldNotify() 检测 idle
  → 发送飞书消息: "猫咪在等你回来~"
```

## 与 OpenClaw 集成

### HEARTBEAT.md 添加检查

```yaml
- name: buddy-idle-check
  interval: 30m
  prompt: "Check buddy-state.json lastInteraction. If > 30min idle, send Feishu reminder with buddy name"
```

### impl/utils/index.ts 添加入口

```typescript
export * as buddy from './buddy-companion-service'

// 用法
import { buddy } from './impl/utils'
buddy.generateBuddy(userId)
buddy.formatBuddyCard(currentBuddy)
```

## PRNG 实现

```typescript
// Mulberry32 - 小巧的种子随机数生成器
function mulberry32(seed: number): () => number {
  // 生成确定性随机数序列
  // 同一种子 → 同一序列 → 同一 Buddy
}

// 字符串哈希
hashString(userId + timestamp) → seed
```

## 性能指标

| 操作 | 预期耗时 | Ops/sec |
|------|---------|---------|
| generateBuddy | < 1ms | 1M+ |
| rollRarity | < 0.01ms | 100M+ |
| rollStats | < 0.1ms | 10M+ |
| formatBuddyCard | < 1ms | 1M+ |

## 与 Claude Code 对比

| 功能 | Claude Code | OpenClaw | 状态 |
|------|-------------|----------|------|
| generateBuddy | ✅ | ✅ | ✅ |
| 稀有度系统 | 5 级 | 5 级 | ✅ |
| 属性系统 | 6 项 | 6 项 | ✅ |
| Sprite 渲染 | React Ink | 飞书卡片 | ⚠️ |
| CompanionSprite | 46KB | 简化 | ⚠️ |

## 关键差距

### Sprite 渲染

**Claude Code**:
- CompanionSprite.tsx (46KB) - React Ink 渲染
- 使用 ANSI 艺术显示 Buddy

**OpenClaw**:
- 飞书卡片文本渲染（简化）
- 无 ANSI 艺术

### 下一步

1. 飞书卡片显示 Buddy emoji/图片
2. 属性条形图美化
3. Buddy 进化系统（互动解锁）
4. 多 Buddy 收集

---

生成时间: 2026-04-13 20:45
状态: Phase 13 实现完成 ✅