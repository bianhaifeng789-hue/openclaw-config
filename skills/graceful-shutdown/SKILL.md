---
name: graceful-shutdown
description: "Graceful shutdown mechanism: cleanup terminal modes, execute SessionEnd hooks, flush analytics, print resume hint. Failsafe timer with SIGKILL fallback. Use when shutting down, cleaning up resources, or handling SIGTERM/SIGINT."
metadata:
  openclaw:
    emoji: "🛑"
    triggers: [session-end, shutdown]
    feishuCard: true
---

# Graceful Shutdown Skill - 优雅关闭

会话结束时执行清理操作，确保数据完整保存。

## 为什么需要这个？

**场景**：
- 会话正常结束
- 用户主动关闭
- 系统中断
- 确保数据保存

**Claude Code 方案**：gracefulShutdown.ts + failsafe timer
**OpenClaw 飞书适配**：SessionEnd hooks + 飞书卡片关闭提示

---

## Shutdown 流程

### 1. Cleanup Terminal Modes

```typescript
// 清理 terminal 状态
function cleanupTerminalModes(): void {
  // ANSI CSI sequences
  process.stdout.write('\x1b[?25h')  // Show cursor
  process.stdout.write('\x1b[0m')    // Reset colors
  process.stdout.write('\x1b[2J')    // Clear screen
  process.stdout.write('\x1b[H')     // Reset cursor
}
```

### 2. Execute SessionEnd Hooks

```typescript
async function executeSessionEndHooks(): Promise<void> {
  const hooks = getSessionEndHooks()
  
  for (const hook of hooks) {
    try {
      await executeHook(hook, { timeout: 5000 })
    } catch (error) {
      logError('SessionEnd hook failed', error)
    }
  }
}
```

### 3. Flush Analytics

```typescript
async function flushAnalytics(): Promise<void> {
  try {
    await analytics.flush({ timeout: 500 })
  } catch (error) {
    // Analytics flush 失败不阻塞关闭
    logError('Analytics flush failed', error)
  }
}
```

### 4. Print Resume Hint

```typescript
function printResumeHint(): void {
  const sessionId = getSessionId()
  console.log(`\nSession ended. Resume with: /resume ${sessionId}`)
  console.log(`Or start a new session.`)
}
```

---

## Failsafe Timer

```typescript
// 强制退出机制
const FAILSAFE_TIMEOUT = 5000  // 5 seconds
const HOOK_BUDGET = 2000       // 2 seconds for hooks

async function gracefulShutdown(): Promise<void> {
  // 设置 failsafe timer
  const failsafe = setTimeout(() => {
    console.log('Failsafe timeout reached, forcing exit')
    process.exit(1)  // Exit immediately
  }, FAILSAFE_TIMEOUT)
  
  try {
    // 执行清理流程
    cleanupTerminalModes()
    await executeSessionEndHooks()
    await flushAnalytics()
    printResumeHint()
    
    // 清除 failsafe
    clearTimeout(failsafe)
    
    // 正常退出
    process.exit(0)
  } catch (error) {
    // 异常时强制退出
    clearTimeout(failsafe)
    process.exit(1)
  }
}
```

---

## 飞书卡片格式

### Session End 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🛑 Session Ended**\n\n**会话已结束**\n\n---\n\n**清理操作**：\n✅ Terminal modes 清理\n✅ SessionEnd hooks 执行\n✅ Analytics 数据保存\n✅ Memory 状态更新\n\n---\n\n**恢复提示**：\n下次可直接开始新对话，或使用 `/resume` 恢复此会话\n\n---\n\n**Session ID**：`session-abc123`\n\n**时长**：45 分钟\n\n**Messages**：28 条"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 触发关闭

```
Graceful Shutdown:
1. 接收到关闭信号（SIGINT/SIGTERM）
2. 启动 failsafe timer
3. 执行清理流程
4. 发送飞书卡片
5. 正常退出
```

### 2. 清理执行

```typescript
async function executeShutdown(): Promise<void> {
  // 1. 清理 terminal
  cleanupTerminalModes()
  
  // 2. 执行 hooks（有 timeout）
  await executeSessionEndHooks({ timeout: HOOK_BUDGET })
  
  // 3. 刷新 analytics
  await flushAnalytics({ timeout: 500 })
  
  // 4. 更新 memory 状态
  await updateMemoryState()
  
  // 5. 发送飞书卡片
  await sendSessionEndCard()
  
  // 6. 打印恢复提示
  printResumeHint()
}
```

---

## 持久化存储

```json
// memory/graceful-shutdown-state.json
{
  "shutdowns": [
    {
      "sessionId": "session-1",
      "timestamp": "2026-04-12T00:00:00Z",
      "hooksExecuted": 3,
      "analyticsFlushed": true,
      "duration": "45 minutes",
      "messages": 28
    }
  ],
  "stats": {
    "totalShutdowns": 0,
    "successfulShutdowns": 0,
    "forcedShutdowns": 0
  },
  "config": {
    "failsafeTimeoutMs": 5000,
    "hookBudgetMs": 2000,
    "analyticsFlushTimeoutMs": 500
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| cleanupTerminalModes | 飞书无 terminal，跳过 |
| executeSessionEndHooks | SessionEnd hooks |
| analytics.flush | OpenClaw analytics |
| printResumeHint | 飞书卡片提示 |
| Failsafe timer | 同样需要 |

---

## 注意事项

1. **Failsafe timer**：确保不会卡住
2. **Hook timeout**：每个 hook 有执行时限
3. **Analytics flush**：500ms timeout，失败不阻塞
4. **飞书卡片**：发送关闭通知
5. **Memory 状态**：更新 daily memory

---

## 自动启用

此 Skill 在 session end 或系统关闭时自动触发。

---

## 下一步增强

- Hook 执行失败重试
- Analytics 批量保存
- Shutdown 日志分析
- 自动恢复机制