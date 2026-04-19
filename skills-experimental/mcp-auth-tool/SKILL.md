# MCP Auth Tool Skill

MCP认证工具 - Pseudo-tool pattern + OAuth flow + Background reconnect + Prefix replacement。

## 功能概述

从Claude Code的McpAuthTool提取的MCP认证模式，用于OpenClaw的MCP server认证。

## 核心机制

### Pseudo-Tool Pattern

```typescript
export function createMcpAuthTool(serverName: string, config: ScopedMcpServerConfig): Tool {
  return {
    name: buildMcpToolName(serverName, 'authenticate'),
    isMcp: true,
    mcpInfo: { serverName, toolName: 'authenticate' },
    description: `Server ${serverName} requires authentication. Call this to start OAuth.`
  }
}
// needs-auth server → create pseudo-tool
// 占位直到auth完成
```

### OAuth Flow with URL Capture

```typescript
let resolveAuthUrl: ((url: string) => void) | undefined
const authUrlPromise = new Promise<string>(resolve => resolveAuthUrl = resolve)

const oauthPromise = performMCPOAuthFlow(
  serverName,
  config,
  u => resolveAuthUrl?.(u),  // onAuthorizationUrl callback
  controller.signal,
  { skipBrowserOpen: true }
)

const authUrl = await Promise.race([
  authUrlPromise,
  oauthPromise.then(() => null)  // silent auth completes without URL
])
// Race: URL vs silent completion
// 捕获auth URL立即返回
```

### Background Reconnect

```typescript
void oauthPromise.then(async () => {
  clearMcpAuthCache()
  const result = await reconnectMcpServerImpl(serverName, config)
  const prefix = getMcpPrefix(serverName)
  setAppState(prev => ({
    ...prev,
    mcp: {
      clients: prev.mcp.clients.map(c => c.name === serverName ? result.client : c),
      tools: [
        ...reject(prev.mcp.tools, t => t.name?.startsWith(prefix)),
        ...result.tools
      ]
    }
  }))
})
// OAuth完成 → reconnect → replace tools
// Prefix-based replacement removes pseudo-tool
```

### Prefix Replacement

```typescript
const prefix = getMcpPrefix(serverName)
tools: [
  ...reject(prev.mcp.tools, t => t.name?.startsWith(prefix)),  // remove old
  ...result.tools  // add new
]
// mcp__server__* prefix → wipe all old tools
// Add fresh tools
// Pseudo-tool自动移除
```

### Unsupported Transport Check

```typescript
if (config.type !== 'sse' && config.type !== 'http') {
  return {
    status: 'unsupported',
    message: `Server uses ${transport} which does not support OAuth. Run /mcp manually.`
  }
}
// Only sse/http support OAuth
// stdio需要手动auth
```

### ClaudeAI Proxy Special

```typescript
if (config.type === 'claudeai-proxy') {
  return {
    status: 'unsupported',
    message: `This is claude.ai connector. Run /mcp and select "${serverName}" to auth.`
  }
}
// claude.ai connectors有特殊流程
// 不在此tool处理
```

### Silent Auth

```typescript
if (!authUrl) {
  return {
    status: 'auth_url',
    message: `Authentication completed silently. Tools now available.`
  }
}
// Silent auth (XAA cached token) → 无URL
// 直接可用
```

## 实现建议

### OpenClaw适配

1. **pseudoTool**: Pseudo-tool pattern
2. **oauthFlow**: OAuth flow
3. **bgReconnect**: Background reconnect
4. **prefixReplace**: Prefix replacement

### 状态文件示例

```json
{
  "serverName": "slack",
  "authUrl": "https://...",
  "status": "auth_url",
  "bgReconnectStarted": true,
  "transport": "sse"
}
```

## 关键模式

### Pseudo-Tool Placeholder

```
needs-auth → create pseudo-tool → OAuth → replace with real tools
// 占位 + 自动swap
// 用户看到server存在
```

### OAuth URL Race

```
authUrlPromise vs oauthPromise.then(() => null)
// URL or silent completion
// 快速返回
```

### Prefix Auto-Removal

```
prefix = mcp__server__ → reject all + add new → pseudo-tool removed
// 工具列表自动更新
// 无需手动清理
```

### Background Continuation

```
void oauthPromise.then() → reconnect → setAppState
// 后台完成reconnect
// 不block tool return
```

## 借用价值

- ⭐⭐⭐⭐⭐ Pseudo-tool placeholder pattern
- ⭐⭐⭐⭐⭐ OAuth URL race pattern
- ⭐⭐⭐⭐⭐ Prefix-based auto-removal
- ⭐⭐⭐⭐ Background reconnect continuation
- ⭐⭐⭐⭐ Unsupported transport fallback

## 来源

- Claude Code: `tools/McpAuthTool/McpAuthTool.ts` (8KB+)
- 分析报告: P38-29