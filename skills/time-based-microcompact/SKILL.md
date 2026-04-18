---
name: time-based-microcompact
description: |
  Time-based microcompact: clear old tool results when prompt cache has likely expired (>60 min gap), reducing tokens sent to API.
  
  Use when:
  - Session has been idle for >60 minutes
  - Context window is large with old tool results
  - Before making a new API call after long gap
  
  Keywords: microcompact, prompt cache, token reduction, idle session, cache expiry
metadata:
  openclaw:
    emoji: "🧹"
    source: claude-code-time-based-mc
    triggers: [idle-session, cache-expired, token-reduction, pre-api-call]
    priority: P2
---

# Time-Based MicroCompact

基于 Claude Code `timeBasedMCConfig.ts` + `microCompact.ts` 的时间触发上下文压缩。

## 核心逻辑（来自 Claude Code）

### 触发条件
```typescript
type TimeBasedMCConfig = {
  enabled: boolean
  gapThresholdMinutes: number  // 默认 60 分钟
  keepRecent: number           // 保留最近 N 个工具结果（默认 5）
}
```

**触发时机**：API 调用**之前**（不是之后）
- `now - lastAssistantMessageTimestamp > gapThresholdMinutes`
- 服务端 prompt cache TTL = 1 小时，超过后 cache 必然失效
- 清理旧工具结果 → 减少重写的 token 数

### 可压缩的工具类型
```
FileRead, Bash/Shell, Grep, Glob,
WebSearch, WebFetch, FileEdit, FileWrite
```

### 压缩策略
```
1. 找出所有 compactable 工具结果
2. 按时间排序，保留最近 keepRecent 个
3. 其余替换为: "[Old tool result content cleared]"
4. 图片内容（>2000 tokens）也清除
```

## OpenClaw 适配实现

### 检查是否需要压缩

```javascript
function shouldTimeBasedMicrocompact(lastAssistantAt, config = {
  enabled: true,
  gapThresholdMinutes: 60,
  keepRecent: 5
}) {
  if (!config.enabled) return false
  const gapMs = Date.now() - lastAssistantAt
  const gapMinutes = gapMs / 60000
  return gapMinutes > config.gapThresholdMinutes
}
```

### 执行压缩

```javascript
function microcompactMessages(messages, keepRecent = 5) {
  const compactableTools = new Set([
    'read', 'bash', 'grep', 'glob', 'web_fetch', 'write', 'edit'
  ])
  
  // 找出所有可压缩的工具结果
  const toolResults = messages
    .filter(m => m.role === 'tool' && compactableTools.has(m.toolName))
    .sort((a, b) => a.timestamp - b.timestamp)
  
  // 保留最近 keepRecent 个，其余清空
  const toKeep = new Set(toolResults.slice(-keepRecent).map(m => m.id))
  
  return messages.map(m => {
    if (m.role === 'tool' && compactableTools.has(m.toolName) && !toKeep.has(m.id)) {
      return { ...m, content: '[Old tool result content cleared]' }
    }
    return m
  })
}
```

### 状态追踪

```json
// memory/microcompact-state.json
{
  "lastAssistantMessageAt": "2026-04-13T17:00:00+08:00",
  "lastMicrocompactAt": null,
  "microcompactCount": 0
}
```

### 在 heartbeat 中检查

```
每次 heartbeat：
1. 读取 microcompact-state.json
2. 计算 gap = now - lastAssistantMessageAt
3. 如果 gap > 60 分钟 且 lastMicrocompactAt < lastAssistantMessageAt：
   → 标记下次 API 调用前需要 microcompact
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 触发时机 | API 调用前自动 | heartbeat 检测 + 标记 |
| 图片清理 | >2000 tokens 的图片 | 不实现（飞书场景少图片） |
| 配置来源 | GrowthBook 远端配置 | 本地固定配置 |
| 主线程限制 | 仅主线程（非 subagent） | 无限制 |
