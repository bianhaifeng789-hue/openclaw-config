---
name: mcp-oauth-auto-refresh
description: Automatic OAuth token refresh for MCP servers with client_credentials and refresh_token grants. Detects expiring tokens (within refresh_skew_seconds) and auto-refreshes before expiration. Use when configuring MCP OAuth, managing enterprise API tokens, or needing automatic token refresh.
---

# MCP OAuth Auto-Refresh

借鉴 DeerFlow 2.0 的 OAuth token 自动刷新机制。

## Why This Matters

企业级 MCP 集成通常需要 OAuth 认证：
- Token 会过期（expires_in 通常 1小时）
- 手动刷新繁琐且容易忘记
- DeerFlow 提供 `refresh_skew_seconds` 提前刷新机制

## How It Works

```
Timeline:
  
  Token issued ──────────────────── Token expires
  (expires_in: 3600s)                  (expires_at)
  
                    ↑
            refresh_skew_seconds: 60
            (提前60秒检测并刷新)
```

**关键参数**:
- `refresh_skew_seconds`: 60（提前60秒刷新）
- `grant_type`: `client_credentials` 或 `refresh_token`
- `token_url`: OAuth token endpoint

## Configuration

### extensions-config.json

```json
{
  "mcpServers": {
    "github-mcp": {
      "enabled": true,
      "type": "http",
      "url": "https://api.github.com/mcp",
      "oauth": {
        "enabled": true,
        "token_url": "https://github.com/login/oauth/access_token",
        "grant_type": "client_credentials",
        "client_id": "$GITHUB_CLIENT_ID",
        "client_secret": "$GITHUB_CLIENT_SECRET",
        "scope": "repo",
        "refresh_skew_seconds": 60
      }
    }
  }
}
```

### Supported Grant Types

| Grant Type | Use Case | Required Fields |
|------------|----------|-----------------|
| `client_credentials` | Server-to-server | client_id, client_secret, scope |
| `refresh_token` | User authorization | client_id, client_secret, refresh_token |

## Scripts

**初始化配置**:
```bash
node impl/bin/mcp-oauth-refresh.js init
```

**扫描所有 token**:
```bash
node impl/bin/mcp-oauth-refresh.js scan
```

**刷新特定 server**:
```bash
node impl/bin/mcp-oauth-refresh.js refresh github-mcp
```

**查看状态**:
```bash
node impl/bin/mcp-oauth-refresh.js status
```

## Heartbeat Integration

**新增心跳任务**（HEARTBEAT.md）:
```yaml
- name: mcp-oauth-refresh
  interval: 30m
  priority: high
  prompt: "Run `node impl/bin/mcp-oauth-refresh.js scan` to check all OAuth tokens. If tokens expiring within 60s, auto-refresh. Send Feishu card if refresh failed."
```

## Environment Variables

使用 `$VAR_NAME` 格式引用环境变量（推荐方式）:

```bash
# .env 文件
MCP_OAUTH_CLIENT_ID=your_client_id
MCP_OAUTH_CLIENT_SECRET=your_client_secret
```

**优势**: Secrets 不写入配置文件，完全隔离。

## State Tracking

**mcp-oauth-state.json**:
```json
{
  "tokens": {
    "github-mcp": {
      "access_token": "gho_xxxx",
      "expires_at": 1703275200,
      "expires_in": 3600,
      "refresh_token": null,
      "token_type": "Bearer",
      "scope": "repo"
    }
  },
  "refreshStats": {
    "totalRefreshes": 5,
    "failedRefreshes": 0,
    "lastRefreshAt": "2026-04-15T15:00:00Z"
  }
}
```

## Borrowed From

DeerFlow 2.0 - `backend/docs/MCP_SERVER.md`

**关键借鉴**:
- `refresh_skew_seconds` 提前刷新机制
- 支持 `client_credentials` + `refresh_token` grants
- Environment variable 引用（`$VAR_NAME`）
- State tracking + 统计报告

---

_创建时间: 2026-04-15_
_移植来源: https://github.com/bytedance/deer-flow_