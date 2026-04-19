---
name: forked-agent-cache
description: "Forked Agent Cache Sharing - Share prompt cache between parent session and forked subagents. Reduces token usage for background tasks. Use when [forked agent cache] is needed."
metadata:
  openclaw:
    emoji: "🔄"
    triggers: [post-sampling, background-task]
    priority: high
    imports:
      - impl/utils/forked-agent-cache.ts
---

# Forked Agent Cache Skill

Forked Agent Cache 共享 - 减少后台任务的 token 消耗。

## 为什么需要

**问题**：
- 每次 sessions_spawn 都是新会话，无 cache 共享
- 后台任务（记忆维护、洞察分析）消耗大量 token
- Claude Code 有 runForkedAgent + CacheSafeParams 机制

**解决**：
- 保存父会话的 cache 关键参数
- Forked agent 使用相同参数共享 prompt cache
- 减少 50-90% 的 token 消耗（取决于 cache hit）

---

## 核心机制

### 1. CacheSafeParams

```typescript
interface CacheSafeParams {
  systemPrompt: string           // 必须 match parent
  userContext: Record<string, string>  // 影响 cache
  systemContext: Record<string, string> // 影响 cache
  model: string                  // 影响 cache key
  forkContextMessages: Message[]  // 共享 prefix cache
  thinkingConfig?: ThinkingConfig  // 影响 cache key
}
```

### 2. Cache Key 组成

Anthropic API cache key 由以下组成：
- system prompt
- tools
- model
- messages (prefix)
- thinking config

**关键**：Forked agent 必须使用相同参数才能命中 cache。

---

## 使用方式

### 1. 保存 CacheSafeParams

```typescript
// 在采样后保存（post-sampling hook）
import { saveCacheSafeParams, createCacheSafeParams } from './forked-agent-cache'

// 从当前会话创建 params
const params = createCacheSafeParams({
  systemPrompt: currentSystemPrompt,
  userContext: currentUserContext,
  model: currentModel,
  messages: recentMessages
})

// 保存供后续 fork 使用
saveCacheSafeParams(params)
```

### 2. 运行 Forked Agent

```typescript
import { runForkedAgent, getLastCacheSafeParams } from './forked-agent-cache'

// 获取保存的 cache params
const cacheParams = getLastCacheSafeParams()

// 运行 forked agent（共享 cache）
const result = await runForkedAgent({
  task: 'Update MEMORY.md...',
  cacheSafeParams: cacheParams,
  runtime: 'subagent',
  mode: 'run'
})

// result 包含 usage metrics
console.log('Cache hit:', result.totalUsage.cacheReadTokens)
```

---

## Token 节省示例

### 无 Cache 共享

```
新会话:
- system prompt: 50,000 tokens
- user context: 5,000 tokens
- messages prefix: 10,000 tokens
总计: 65,000 tokens (全量计费)
```

### 有 Cache 共享

```
Forked agent:
- cache_read_input_tokens: 60,000 tokens
- 新增内容: 5,000 tokens
总计: 5,000 tokens (新内容计费)
节省: 92%
```

---

## 借鉴 Claude Code

| Claude Code | OpenClaw |
|-------------|----------|
| `saveCacheSafeParams()` | `saveCacheSafeParams()` |
| `getLastCacheSafeParams()` | `getLastCacheSafeParams()` |
| `runForkedAgent()` | `runForkedAgent()` |
| `createSubagentContext()` | `createSubagentContext()` |
| `forkContextMessages` | `forkContextMessages` |

---

## 状态隔离

Forked agent 使用隔离的上下文，防止污染父会话：

| 字段 | 处理方式 |
|-----|---------|
| readFileState | 克隆（独立缓存） |
| abortController | 新建子控制器 |
| getAppState | wrapped（避免 permission prompts） |
| setAppState | no-op（不影响父状态） |
| messages | 独立数组 |

---

## 适用场景

### 适合使用 Cache 共享

- ✅ 记忆维护（SessionMemory）
- ✅ 洞察分析（InsightsAnalysis）
- ✅ Auto Dream（记忆整合）
- ✅ Prompt Suggestion
- ✅ /btw 命令

### 不适合使用 Cache 共享

- ❌ Compact（需要 maxOutputTokens，会改变 budget_tokens）
- ❌ 用户交互式子代理（需要 shareSetAppState）

---

## 配置

```yaml
forkedAgentCache:
  enabled: true
  maxCacheAge: 2h        # cache 有效期
  maxContextMessages: 10 # 共享的 prefix messages 数量
  skipCacheWrite: false  # 是否跳过 cache 写入（fire-and-forget）
```

---

## 注意事项

1. **maxOutputTokens 会改变 cache key**：不要在 fork 中设置（除非不需要 cache）
2. **thinking config 也影响 cache**：确保 fork 使用相同的 thinking 设置
3. **messages prefix 必须完全匹配**：包括顺序和内容
4. **cache 有时效性**：Anthropic cache 可能过期，需要定期刷新

---

## 与 sessions_spawn 整合

当前实现需要 OpenClaw 的 `sessions_spawn` 支持传递 cache 参数：

```typescript
// 当前 sessions_spawn
sessions_spawn({
  task: '...',
  runtime: 'subagent'
})

// 扩展后（支持 cache）
sessions_spawn({
  task: '...',
  runtime: 'subagent',
  cacheSafeParams: {
    systemPrompt: '...',
    model: '...',
    forkContextMessages: [...]
  }
})
```

---

## 下一步

1. 扩展 `sessions_spawn` API 支持传递 cache params
2. 在 heartbeat hooks 中自动保存 CacheSafeParams
3. 在后台任务中自动使用 cache 共享
4. 添加 cache hit rate 追踪和日志

---

## 代码位置

- `impl/utils/forked-agent-cache.ts` - 核心实现
- `impl/utils/background-task-utils.ts` - 整合使用
- `skills/heartbeat-task-visualizer/SKILL.md` - 心跳整合

---

## 参考资料

- Claude Code: `src/utils/forkedAgent.ts`
- Anthropic API: Prompt Caching documentation
- OpenClaw: `sessions_spawn` tool definition