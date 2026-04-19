# MCP Connection Manager Skill

MCP连接管理 - 多transport类型、认证、重连和session expiry恢复。

## 功能概述

从Claude Code的mcp/client.ts提取的MCP连接管理模式，用于OpenClaw的MCP服务器管理。

## Transport类型

```typescript
'stdio'     // 本地进程（command + args）
'sse'       // Server-Sent Events（URL + OAuth）
'sse-ide'   // IDE SSE（无认证）
'ws-ide'    // IDE WebSocket（authToken）
'http'      // Streamable HTTP（URL + OAuth）
'ws'        // WebSocket（URL + headers）
'sdk'       // In-process SDK
'claudeai-proxy'  // Claude.ai代理
```

## 核心机制

### Auth Provider

```typescript
ClaudeAuthProvider(name, serverRef)
// 提供：
// - OAuth token获取/刷新
// - Session ingress token
// - Step-up detection (403 → auth challenge)
```

### Fetch Wrapper

#### Timeout Wrapper
```typescript
wrapFetchWithTimeout(baseFetch)
// 每个request新的60s timeout
// Skip GET (long-lived SSE streams)
// Normalize MCP Streamable HTTP Accept header
```

#### Step-Up Detection
```typescript
wrapFetchWithStepUpDetection(fetch, authProvider)
// 403 → authProvider.auth() → retry
```

### Session Expiry Detection

```typescript
isMcpSessionExpiredError(error):
  // HTTP 404 + JSON-RPC code -32001 ("Session not found")
  // → 关闭transport → 重连获取fresh session ID
```

### 重连逻辑

#### Consecutive Error Tracking
```typescript
MAX_ERRORS_BEFORE_RECONNECT = 3
consecutiveConnectionErrors++
// 终端错误: ECONNRESET, ETIMEDOUT, EPIPE, EHOSTUNREACH, ECONNREFUSED
// 非终端 → reset counter
```

#### OnClose Handler
```typescript
client.onclose = () => {
  // 清除memoize cache
  connectToServer.cache.delete(key)
  fetchToolsForClient.cache.delete(name)
  fetchResourcesForClient.cache.delete(name)
  // 下次调用触发重连
}
```

### Memoization

```typescript
connectToServer = memoize(
  async (name, serverRef, stats) => { ... },
  getServerCacheKey  // `${name}-${JSON.stringify(serverRef)}`
)
```

### 批量连接

```typescript
getMcpServerConnectionBatchSize(): number      // 默认3（本地）
getRemoteMcpServerConnectionBatchSize(): number // 默认20（远程）
```

### Process Cleanup（Stdio）

```typescript
// 优雅关闭序列：
SIGINT (100ms) → SIGTERM (400ms) → SIGKILL
// 用checkInterval监控进程退出
```

## 实现建议

### OpenClaw适配

1. **transport**: 支持stdio/http/ws
2. **auth**: OAuth + session ingress
3. **重连**: cache invalidation + fresh client
4. **cleanup**: registerCleanup注册

### 状态文件示例

```json
{
  "servers": {
    "github": {
      "type": "http",
      "status": "connected",
      "consecutiveErrors": 0,
      "lastConnectAt": 1703275200
    }
  },
  "batchSize": 3
}
```

## 关键模式

### Session Expiry Recovery

```
404 + -32001 → McpSessionExpiredError
→ closeTransportAndRejectPending()
→ pending callTool() reject
→ next call gets fresh client via memoize cache clear
```

### SSE Reconnection Exhausted

```typescript
'Maximum reconnection attempts' in error.message
→ closeTransportAndRejectPending()
// SDK的SSE transport耗尽重试但never calls onclose
```

### Auth Cache

```typescript
mcp-needs-auth-cache.json
// TTL: 15min
// 防止同一server反复needs-auth弹窗
```

## 借用价值

- ⭐⭐⭐⭐⭐ Session expiry恢复是关键
- ⭐⭐⭐⭐⭐ 连续错误tracking防止瞬时错误触发重连
- ⭐⭐⭐⭐ 多transport支持
- ⭐⭐⭐⭐ 批量连接优化启动速度

## 来源

- Claude Code: `services/mcp/client.ts`
- 分析报告: P33-6