---
name: auto-dream-consolidation
description: |
  Background memory consolidation service. Fires /dream prompt as forked subagent when time-gate (24h) AND session-gate (5 sessions) pass. Uses lock to prevent concurrent consolidation.
  
  Use when:
  - Implementing automatic memory consolidation
  - Running background dream/consolidation tasks
  - Checking if auto-dream should fire
  
  Keywords: auto-dream, memory consolidation, background consolidation, dream prompt, session gate
metadata:
  openclaw:
    emoji: "💭"
    source: claude-code-auto-dream
    triggers: [auto-dream, memory-consolidation, background-dream]
    priority: P1
---

# Auto Dream Consolidation

基于 Claude Code `services/autoDream/autoDream.ts` 的后台记忆整合服务。

## 核心机制（来自 Claude Code）

### 触发条件（门控顺序，从最便宜到最贵）
```
1. 时间门控: 距上次整合 >= minHours（默认 24h）
2. 会话门控: 自上次整合后的 session 数 >= minSessions（默认 5）
3. 锁门控: 没有其他进程正在整合
```

### 默认配置
```typescript
const DEFAULTS = {
  minHours: 24,      // 至少 24 小时
  minSessions: 5,    // 至少 5 个 session
}
```

### 扫描节流
```
时间门通过但会话门未通过时 → 10分钟内不重复扫描
（避免每轮都扫描 session 文件）
```

## OpenClaw 适配实现

### 状态文件（memory/dream-state.json）
```json
{
  "lastConsolidatedAt": 1744459200000,
  "sessionCount": 3,
  "isLocked": false,
  "lockAcquiredAt": null
}
```

### 触发检查逻辑

```javascript
async function shouldRunAutoDream() {
  const state = await readDreamState()
  const now = Date.now()
  
  // 时间门控
  const hoursSince = (now - state.lastConsolidatedAt) / 3_600_000
  if (hoursSince < 24) return false
  
  // 会话门控
  const sessionCount = await countSessionsSince(state.lastConsolidatedAt)
  if (sessionCount < 5) return false
  
  // 锁检查
  if (state.isLocked) return false
  
  return true
}
```

### 整合流程

```javascript
async function runAutoDream() {
  if (!await shouldRunAutoDream()) return
  
  // 获取锁
  await acquireConsolidationLock()
  
  try {
    // 读取最近 session 的记忆文件
    const recentMemories = await collectRecentMemories()
    
    // 构建整合 prompt
    const prompt = buildConsolidationPrompt(recentMemories)
    
    // 启动 forked subagent 执行整合
    await sessions_spawn({
      task: prompt,
      mode: 'run',
      cleanup: 'delete'
    })
    
    // 更新状态
    await updateDreamState({ lastConsolidatedAt: Date.now() })
    
    // 飞书通知
    await notifyFeishu('💭 记忆整合完成')
  } finally {
    await releaseConsolidationLock()
  }
}
```

### 整合 Prompt 模板（来自 Claude Code consolidationPrompt.ts）
```
你是一个记忆整合助手。请分析以下最近 {sessionCount} 个会话的记忆文件，
提取重要的长期信息，更新 MEMORY.md 的相关区块。

重点关注：
- 用户偏好和工作模式变化
- 重要决策和原因
- 项目进展里程碑
- 经验教训

最近会话记忆：
{recentMemories}

请更新 MEMORY.md 中的 AUTO_UPDATE 区块。
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 触发方式 | postSamplingHook（每轮对话后） | heartbeat 检查 |
| 锁机制 | 文件锁（mtime） | dream-state.json isLocked |
| 整合执行 | runForkedAgent（进程内） | sessions_spawn subagent |
| 通知 | 无（静默） | 飞书消息通知 |
| 配置来源 | GrowthBook 远端 | 本地固定值 |
