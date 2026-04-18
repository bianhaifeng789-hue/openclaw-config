---
name: api-retry-strategy
description: |
  API call retry strategy with exponential backoff, 429/529 handling, OAuth token refresh, and model fallback.
  
  Use when:
  - API calls fail with rate limit (429) or overload (529)
  - OAuth token expired (401) or revoked (403)
  - Network connection reset (ECONNRESET/EPIPE)
  - Need to implement resilient API calls
  
  Keywords: retry, rate limit, 429, 529, backoff, API error, token refresh, fallback
metadata:
  openclaw:
    emoji: "🔄"
    source: claude-code-with-retry
    triggers: [api-error, rate-limit, retry, 429, 529]
    priority: P1
---

# API Retry Strategy

基于 Claude Code `services/api/withRetry.ts` 的 API 重试策略，处理各类错误场景。

## 核心参数（来自 Claude Code）

```typescript
const DEFAULT_MAX_RETRIES = 10
const BASE_DELAY_MS = 500
const MAX_529_RETRIES = 3           // 连续 529 超过 3 次 → 触发 fallback
const PERSISTENT_MAX_BACKOFF_MS = 5 * 60 * 1000  // 最大退避 5 分钟
```

## 错误分类与处理策略

### 429 Rate Limit
```
1. 读取 Retry-After header
2. 如果 retryAfterMs < 短重试阈值：等待后重试（保持 fast mode）
3. 如果 retryAfterMs 较长：进入 cooldown，切换到标准速度模型
4. 最多重试 DEFAULT_MAX_RETRIES 次
```

### 529 Overload
```
1. 连续 529 计数
2. 如果 consecutive529 >= MAX_529_RETRIES：触发 FallbackTriggeredError
3. 指数退避：BASE_DELAY_MS * 2^attempt（有上限）
4. 前台查询（用户等待）才重试，后台查询（摘要/建议）直接失败
```

### 401 Token Expired
```
1. 强制刷新 OAuth token
2. 重新获取 client
3. 重试请求
```

### 403 Token Revoked
```
1. 清除 token 缓存
2. 重新认证
3. 重试
```

### ECONNRESET / EPIPE（连接重置）
```
1. 禁用 keep-alive（避免复用坏连接）
2. 重新创建 client
3. 重试
```

## OpenClaw 适配实现

```javascript
async function withRetry(operation, options = {}) {
  const {
    maxRetries = 10,
    baseDelayMs = 500,
    signal,
    onRetry
  } = options
  
  let lastError
  let consecutive529 = 0
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    if (signal?.aborted) throw new Error('Aborted')
    
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      
      // 不重试的错误
      if (isUserAbort(error) || isAuthError(error) || isPromptError(error)) {
        throw error
      }
      
      // 429 Rate Limit
      if (error.status === 429) {
        const retryAfter = getRetryAfterMs(error) ?? baseDelayMs * Math.pow(2, attempt)
        await sleep(Math.min(retryAfter, 5 * 60 * 1000), signal)
        continue
      }
      
      // 529 Overload
      if (is529Error(error)) {
        consecutive529++
        if (consecutive529 >= 3) throw new FallbackTriggeredError(error)
        await sleep(baseDelayMs * Math.pow(2, attempt), signal)
        continue
      }
      
      // 最后一次尝试
      if (attempt > maxRetries) throw error
      
      // 其他错误：指数退避
      await sleep(baseDelayMs * Math.pow(2, attempt - 1), signal)
    }
  }
  
  throw lastError
}
```

## 前台 vs 后台查询

```
前台（用户等待）→ 重试 429/529：
  - 主对话
  - compact
  - hook agent

后台（用户不等待）→ 直接失败：
  - 摘要生成
  - prompt suggestion
  - tool use summary
  - 分类器
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| Fast Mode | 有（切换到更快模型） | 无 |
| 持久重试 | CLAUDE_CODE_UNATTENDED_RETRY | 不实现 |
| 心跳保活 | 30s 发送 keep-alive 消息 | 不实现 |
| 模型 fallback | FallbackTriggeredError → 切换模型 | 飞书通知用户 |
