---
name: auto-dream
description: "Background memory consolidation. Periodically runs /dream prompt to extract and organize memories from recent sessions. Runs when enough sessions accumulated. Use when sessionCount >= 5, consolidation needed, or reviewing recent sessions."
metadata:
  openclaw:
    emoji: "💭"
    triggers: [heartbeat, scheduled]
    feishuCard: true
---

# Auto Dream Skill - 后台记忆整合

定期运行 /dream prompt，后台提取和整理记忆。

## 为什么需要这个？

**场景**：
- 多次会话积累大量信息
- 需要自动整理、分类、提取
- 保持 MEMORY.md 更新

**Claude Code 方案**：AutoDream service + forked agent
**OpenClaw 飞书适配**：heartbeat + sessions_spawn

---

## 核心概念

### Dream Prompt

Claude Code 有 `/dream` 命令，用于：
- 回顾近期会话
- 提取关键记忆
- 整理分类信息
- 更新记忆文件

### 自动触发条件

```typescript
interface AutoDreamConfig {
  minHours: number     // 最小间隔（默认 24 小时）
  minSessions: number  // 最小会话数（默认 5 个）
}
```

**触发顺序**（成本最低优先）：
1. Time gate：距离上次 ≥ 24 小时
2. Sessions gate：积累 ≥ 5 个新会话
3. Lock：无其他进程正在整合

---

## Dream Prompt 示例

```
回顾近期会话，提取以下内容：

1. **决策**：做出的重要决定
2. **进展**：项目进展状态
3. **偏好**：发现的用户偏好
4. **教训**：学到的经验教训
5. **待办**：需要跟进的事项

整理并更新记忆文件。
```

---

## 飞书卡片格式

### Dream 启动卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**💭 后台记忆整合启动**\n\n**触发条件**：\n• 距上次整合：24 小时\n• 新会话数：5 个\n\n**任务**：\n回顾近期会话\n提取关键记忆\n整理分类信息\n更新 MEMORY.md\n\n预计耗时：5-10 分钟"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "后台运行中..."}
      ]
    }
  ]
}
```

### Dream 完成卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**✅ 记忆整合完成**\n\n**提取内容**：\n\n**决策**：\n• 采用飞书卡片作为 UI 方案\n• 使用 heartbeat 替代终端通知\n\n**进展**：\n• 11 个功能已实现\n• 60+ 功能已发现\n\n**偏好**：\n• 简洁回复风格\n• 自动化运行\n\n**教训**：\n• 避开 API 负载高峰（:00/:30）\n• 14 天过期机制\n\n**更新文件**：\nMEMORY.md - 已更新所有区块"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "下次整合：24 小时后"}
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 检查触发条件

```
Heartbeat:
1. 读取 dream-state.json 中 lastConsolidatedAt
2. 计算距离上次的小时数
3. 列出 lastConsolidatedAt 之后的会话数
4. 如果 hours >= 24 且 sessions >= 5：
   → 触发 Auto Dream
```

### 2. 启动 Dream 任务

```
Agent:
1. 发送飞书卡片："💭 后台记忆整合启动"
2. 使用 sessions_spawn 创建 forked agent
3. 运行 Dream Prompt
4. 等待结果
```

### 3. Dream Prompt 执行

```
Forked Agent:
1. 读取最近 5-10 个 daily notes
2. 分析内容：
   - 决策（关键词：决定、采用、选择）
   - 进展（关键词：完成、实现、创建）
   - 偏好（关键词：喜欢、偏好、风格）
   - 教训（关键词：发现、学到、注意）
3. 整理分类
4. 更新 MEMORY.md 标记区块
5. 返回整合结果
```

### 4. 完成通知

```
Agent:
1. 接收 forked agent 结果
2. 发送飞书卡片："✅ 记忆整合完成"
3. 更新 dream-state.json
```

---

## 持久化存储

```json
// memory/dream-state.json
{
  "lastConsolidatedAt": "2026-04-11T23:00:00Z",
  "consolidationLock": null,
  "sessionsTouched": [
    "session-2026-04-11-23",
    "session-2026-04-11-22",
    "session-2026-04-11-21"
  ],
  "config": {
    "minHours": 24,
    "minSessions": 5
  },
  "stats": {
    "dreamsCompleted": 0,
    "memoriesExtracted": 0
  }
}
```

---

## Forked Agent

使用 OpenClaw 的 sessions_spawn：

```typescript
sessions_spawn({
  runtime: 'subagent',
  mode: 'run',
  task: '回顾近期会话，提取关键记忆...',
  label: 'dream-agent',
  lightContext: true,
  timeoutSeconds: 600  // 10 分钟
})
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| AutoDream service | Skill + heartbeat |
| forkedAgent.runForkedAgent | sessions_spawn |
| consolidationLock | dream-state.json |
| GrowthBook gate (tengu_onyx_plover) | 无 gate |
| DreamTask UI | 飞书卡片 |

---

## 注意事项

1. **最小间隔**：24 小时（避免频繁运行）
2. **最小会话**：5 个（确保有内容整合）
3. **Lock**：防止多进程同时整合
4. **Light Context**：forked agent 用轻量上下文
5. **超时**：10 分钟超时

---

## 自动启用

此 Skill 由 heartbeat 定期检查，满足条件时自动触发。

---

## 下一步增强

- 整合策略优化（智能分类）
- 整合结果质量评估
- 整合历史记录
- 整合触发通知（可选静默）