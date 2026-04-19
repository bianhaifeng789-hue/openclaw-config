# Remote Trigger Tool Skill

远程触发器工具 - Feature gate + Policy gate + OAuth token refresh + Beta header。

## 功能概述

从Claude Code的RemoteTriggerTool提取的远程触发器模式，用于OpenClaw的远程agent触发管理。

## 核心机制

### Dual Feature Gate

```typescript
isEnabled() {
  return (
    getFeatureValue_CACHED_MAY_BE_STALE('tengu_surreal_dali', false) &&
    isPolicyAllowed('allow_remote_sessions')
  )
}
// GB feature + policy双重gate
// 必须两个都true
```

### OAuth Token Refresh

```typescript
await checkAndRefreshOAuthTokenIfNeeded()
const accessToken = getClaudeAIOAuthTokens()?.accessToken
if (!accessToken) {
  throw new Error('Not authenticated. Run /login.')
}
// 调用前refresh token
// 确保不会stale
```

### Beta Header

```typescript
const TRIGGERS_BETA = 'ccr-triggers-2026-01-30'
headers: {
  'anthropic-beta': TRIGGERS_BETA
}
// API beta header
// 启用新功能
```

### Organization UUID

```typescript
const orgUUID = await getOrganizationUUID()
if (!orgUUID) {
  throw new Error('Unable to resolve organization UUID.')
}
headers: { 'x-organization-uuid': orgUUID }
// Org UUID header
// 多租户支持
```

### CRUD Action Router

```typescript
switch (action) {
  case 'list': method = 'GET', url = base
  case 'get': method = 'GET', url = `${base}/${trigger_id}`
  case 'create': method = 'POST', url = base, data = body
  case 'update': method = 'POST', url = `${base}/${trigger_id}`, data = body
  case 'run': method = 'POST', url = `${base}/${trigger_id}/run`, data = {}
}
// 5种action统一路由
// API pattern
```

### Validate Status

```typescript
const res = await axios.request({
  method, url, headers, data,
  timeout: 20_000,
  validateStatus: () => true  // 不throw on 4xx/5xx
})
return { data: { status: res.status, json: jsonStringify(res.data) } }
// validateStatus: () => true
// 所有status都返回
// 让model处理error
```

### Abort Signal

```typescript
signal: context.abortController.signal
// 支持abort
// 用户可取消
```

## 实现建议

### OpenClaw适配

1. **dualGate**: Feature + Policy双重gate
2. **tokenRefresh**: OAuth token refresh
3. **betaHeader**: Beta header
4. **actionRouter**: CRUD action路由

### 状态文件示例

```json
{
  "featureEnabled": true,
  "policyAllowed": true,
  "accessToken": "valid",
  "orgUUID": "org-123",
  "action": "list"
}
```

## 关键模式

### Dual Gate Pattern

```
GB feature AND policy → both must be true
// 多层gate
// 安全控制
```

### Token Refresh Before Call

```
checkAndRefreshOAuthTokenIfNeeded() → then getClaudeAIOAuthTokens()
// 确保fresh token
// 不用担心expiry
```

### Beta Header Pattern

```
'anthropic-beta': 'ccr-triggers-2026-01-30'
// 启用新API功能
// A/B测试
```

### Validate Status All

```
validateStatus: () => true → all status codes returned
// 不自动throw
// Model处理error
```

## 借用价值

- ⭐⭐⭐⭐ Dual feature + policy gate
- ⭐⭐⭐⭐ Token refresh pattern
- ⭐⭐⭐⭐ Beta header pattern
- ⭐⭐⭐⭐ CRUD action router
- ⭐⭐⭐⭐ Validate status all

## 来源

- Claude Code: `tools/RemoteTriggerTool/RemoteTriggerTool.ts` (6KB+)
- 分析报告: P38-30