# Auto Dream Service Skill

自动记忆整合服务模式 - 双门控触发forked subagent进行后台记忆整合。

## 功能概述

从Claude Code的autoDream.ts提取的智能触发模式，用于OpenClaw的记忆整合自动化。

## 核心机制

### 双门控（Gate Order）

按成本从低到高检查：

```
1. Time Gate: hoursSinceLast >= minHours (默认24h)
2. Session Gate: transcripts >= minSessions (默认5)
3. Lock Gate: 无其他进程正在整合
```

### 扫描节流

防止时间门通过但session门未通过时每turn重复扫描：

```typescript
SESSION_SCAN_INTERVAL_MS = 10 * 60 * 1000  // 10分钟
```

### 状态管理

- `lastConsolidatedAt`: 上次整合时间戳（单次stat读取）
- `priorMtime`: 锁文件原始mtime（用于rollback）
- `sessionIds`: 待review的session列表（exclude当前session）

### Forked Agent执行

```typescript
runForkedAgent({
  promptMessages: [createUserMessage({ content: consolidationPrompt })],
  cacheSafeParams,  // 借用parent的prompt cache
  canUseTool: createAutoMemCanUseTool(memoryRoot),  // 工具限制
  querySource: 'auto_dream',
  skipTranscript: true,
  overrides: { abortController },
})
```

### 工具限制

Bash只允许read-only命令：
```
ls, find, grep, cat, stat, wc, head, tail
```

### 锁Rollback

失败时回退mtime让时间门下次继续通过：

```typescript
await rollbackConsolidationLock(priorMtime)
```

## 实现建议

### OpenClaw适配

1. **触发时机**: heartbeat hook中检查门控条件
2. **整合目标**: MEMORY.md + memory/*.md
3. **forked agent**: 使用sessions_spawn(runtime='subagent')
4. **锁文件**: memory/.consolidation-lock

### 状态文件示例

```json
{
  "lastConsolidatedAt": 1703275200,
  "lastSessionScanAt": 1703275800,
  "minHours": 24,
  "minSessions": 5,
  "sessionsSinceLast": 12
}
```

## 关键模式

### 闭包作用域状态

tests在beforeEach调用initAutoDream获取新闭包，避免module-level状态污染。

### 进度Watcher

收集text/tool_use/file_paths用于UI显示：

```typescript
function makeDreamProgressWatcher(taskId, setAppState) {
  return msg => {
    // 收集: text, toolUseCount, touchedPaths
  }
}
```

## 借用价值

- ⭐⭐⭐⭐ 智能触发避免过度整合
- ⭐⭐⭐⭐ 锁rollback保证恢复
- ⭐⭐⭐⭐ forked agent借用cache节省成本

## 来源

- Claude Code: `services/autoDream/autoDream.ts`
- 分析报告: P33-1