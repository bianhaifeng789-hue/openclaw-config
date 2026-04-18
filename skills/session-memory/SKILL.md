---
name: session-memory
description: |
  Automatically maintain session-specific markdown notes during conversation.
  
  Use when:
  - User asks "what are we working on" or "show session summary"
  - User says "update session memory" or "refresh notes"
  - Need to recall current session's progress/decisions
  - Long conversation needs context tracking
  
  NOT for:
  - Short conversations (< 10 messages)
  - Simple Q&A without complex context
  - When user explicitly disables memory
  - Already-maintained sessions (avoid overhead)
  
  Auto-trigger conditions:
  - Periodically via HEARTBEAT (controlled by heartbeat-state.json)
  - After significant tool call batches
  - Only when session has > 20 messages
  
  Keywords (require explicit mention):
  - "session memory", "current notes", "session summary", "会话记忆", "当前进度"
metadata:
  openclaw:
    emoji: "📝"
    source: claude-code-core
    triggers: [explicit-request, periodic-automated]
    priority: P0
    autoTrigger: true
    autoTriggerThreshold: 20 messages
    feishuCard: true
---

# Session Memory Service

维护当前会话的markdown笔记文件。

## 手动触发

用户请求查看/更新时执行：
```
用户: "显示会话摘要"
系统: ✅ 读取session memory，展示当前进度
```

## 自动触发

后台自动维护：
- 每30分钟检查一次（HEARTBEAT控制）
- 仅当消息数 > 20 时自动更新
- 使用forked agent避免打断对话

## 误触发防护

❌ 以下情况**不会触发**：
- 短对话（< 10条消息）
- 简单问答
- 用户禁用记忆功能

---

来源: Claude Code services/SessionMemory/ (446+ lines)