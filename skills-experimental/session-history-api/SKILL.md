---
name: session-history-api
description: |
  Fetch paginated session event history from remote API. Replay past sessions, resume interrupted work, audit agent actions.
  
  Use when:
  - User asks to resume a previous session
  - Need to audit what happened in a past session
  - Replaying session events for debugging
  - Cross-session context injection
  
  Keywords: session history, replay, resume session, past events, audit log
metadata:
  openclaw:
    emoji: "📜"
    source: claude-code-session-history
    triggers: [resume-session, session-replay, audit, history]
    priority: P2
---

# Session History API

基于 Claude Code `assistant/sessionHistory.ts` 的远端 session 事件历史拉取。

## 核心概念（来自 Claude Code）

### 数据结构
```typescript
type HistoryPage = {
  events: SDKMessage[]    // 按时间顺序的事件列表
  firstId: string | null  // 最旧事件 ID（用于翻页）
  hasMore: boolean        // 是否有更多历史
}

const HISTORY_PAGE_SIZE = 100
```

### API 接口
```
GET /v1/sessions/{sessionId}/events
  ?limit=100
  ?before_id=<cursor>   // 获取更旧的事件
  ?after_id=<cursor>    // 获取更新的事件

Headers:
  anthropic-beta: ccr-byoc-2025-07-29
  x-organization-uuid: <orgUUID>
```

### 分页策略
```
fetchLatestEvents(ctx):
  → 获取最新 100 条事件（无 cursor）

fetchOlderEvents(ctx, firstId):
  → 获取 firstId 之前的事件（向前翻页）
  → 用于加载完整历史
```

## OpenClaw 适配实现

### 本地 Session 历史

OpenClaw 没有远端 session API，使用本地文件模拟：

```json
// memory/session-history/
//   {sessionId}.jsonl  — 每行一个事件
{
  "type": "user",
  "content": "帮我分析这个文件",
  "timestamp": "2026-04-13T18:00:00+08:00",
  "messageId": "msg-abc"
}
```

### 读取历史

```javascript
async function fetchSessionHistory(sessionId, limit = 100) {
  const historyFile = `memory/session-history/${sessionId}.jsonl`
  const lines = await readFile(historyFile, 'utf-8')
  const events = lines.trim().split('\n').map(JSON.parse)
  return {
    events: events.slice(-limit),
    hasMore: events.length > limit,
    firstId: events[0]?.messageId ?? null
  }
}
```

### 使用场景

**恢复上次会话**：
```
用户: "继续上次的任务"
1. 读取最近的 session history
2. 找到最后的 in_progress todo
3. 注入上下文：
   "上次会话摘要：你正在实现登录功能，已完成 UserModel，
    下一步是 AuthController"
4. 继续执行
```

**审计 agent 操作**：
```
用户: "上次 agent 做了什么修改？"
1. 读取 session history
2. 过滤 FileEdit/FileWrite 事件
3. 列出所有文件修改记录
```

### 与 MEMORY.md 的关系

| 存储 | 内容 | 用途 |
|------|------|------|
| MEMORY.md | 长期记忆（精华） | 跨会话上下文 |
| session-history/ | 完整事件流 | 回放/审计 |
| memory/YYYY-MM-DD.md | 日常笔记 | 近期上下文 |

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 存储 | 远端 API（Anthropic 服务器） | 本地 JSONL 文件 |
| 认证 | OAuth + org UUID | 无需认证 |
| 分页 | cursor-based | offset-based |
| 事件类型 | SDKMessage（完整） | 简化版（user/assistant/tool） |
