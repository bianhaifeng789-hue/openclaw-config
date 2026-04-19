# Session History Pattern Skill

Session History Pattern - HISTORY_PAGE_SIZE=100 + HistoryPage type + createHistoryAuthCtx + fetchPage + anchor_to_latest pattern + beforeId cursor。

## 功能概述

从Claude Code的assistant/sessionHistory.ts提取的会话历史模式，用于OpenClaw的远程历史管理。

## 核心机制

### HISTORY_PAGE_SIZE

```typescript
export const HISTORY_PAGE_SIZE = 100
// Pagination size
// 100 events per page
```

### HistoryPage Type

```typescript
export type HistoryPage = {
  /** Chronological order within the page. */
  events: SDKMessage[]
  /** Oldest event ID in this page → before_id cursor for next-older page. */
  firstId: string | null
  /** true = older events exist. */
  hasMore: boolean
}
// Chronological order within page
# firstId: cursor for next-older page
# hasMore: older events exist flag
```

### HistoryAuthCtx

```typescript
export type HistoryAuthCtx = {
  baseUrl: string
  headers: Record<string, string>
}

/** Prepare auth + headers + base URL once, reuse across pages. */
export async function createHistoryAuthCtx(
  sessionId: string,
): Promise<HistoryAuthCtx> {
  const { accessToken, orgUUID } = await prepareApiRequest()
  return {
    baseUrl: `${getOauthConfig().BASE_API_URL}/v1/sessions/${sessionId}/events`,
    headers: {
      ...getOAuthHeaders(accessToken),
      'anthropic-beta': 'ccr-byoc-2025-07-29',
      'x-organization-uuid': orgUUID,
    },
  }
}
// Prepare auth once, reuse across pages
// baseUrl + headers
# Avoid repeated auth calls
```

### fetchPage

```typescript
async function fetchPage(
  ctx: HistoryAuthCtx,
  params: Record<string, string | number | boolean>,
  label: string,
): Promise<HistoryPage | null> {
  const resp = await axios
    .get<SessionEventsResponse>(ctx.baseUrl, {
      headers: ctx.headers,
      params,
      timeout: 15000,
      validateStatus: () => true,
    })
    .catch(() => null)
  if (!resp || resp.status !== 200) {
    logForDebugging(`[${label}] HTTP ${resp?.status ?? 'error'}`)
    return null
  }
  return {
    events: Array.isArray(resp.data.data) ? resp.data.data : [],
    firstId: resp.data.first_id,
    hasMore: resp.data.has_more,
  }
}
// Generic fetch function
// params: query parameters
// label: for logging
# validateStatus: () => true (accept all)
```

### anchor_to_latest Pattern

```typescript
/**
 * Newest page: last `limit` events, chronological, via anchor_to_latest.
 * has_more=true means older events exist.
 */
export async function fetchLatestEvents(
  ctx: HistoryAuthCtx,
  limit = HISTORY_PAGE_SIZE,
): Promise<HistoryPage | null> {
  return fetchPage(ctx, { limit, anchor_to_latest: true }, 'fetchLatestEvents')
}
// anchor_to_latest: get newest events
# Chronological order
# hasMore=true → older events exist
```

### beforeId Cursor

```typescript
/** Older page: events immediately before `beforeId` cursor. */
export async function fetchOlderEvents(
  ctx: HistoryAuthCtx,
  beforeId: string,
  limit = HISTORY_PAGE_SIZE,
): Promise<HistoryPage | null> {
  return fetchPage(ctx, { limit, before_id: beforeId }, 'fetchOlderEvents')
}
// before_id: cursor for pagination
# Events before cursor
# Older page navigation
```

## 实现建议

### OpenClaw适配

1. **historyPageSize**: HISTORY_PAGE_SIZE=100
2. **historyPageType**: HistoryPage type
3. **historyAuthCtx**: createHistoryAuthCtx pattern
4. **anchorToLatest**: anchor_to_latest pattern
5. **beforeIdCursor**: beforeId cursor pagination

### 状态文件示例

```json
{
  "pageSize": 100,
  "firstId": "evt_abc123",
  "hasMore": true
}
```

## 关键模式

### Auth Context Reuse

```
createHistoryAuthCtx() → prepare auth once → reuse across pages
// 一次准备auth
// 多页面复用
// 避免重复auth调用
```

### anchor_to_latest

```
anchor_to_latest: true → newest events → chronological → hasMore for older
// 获取最新events
// 按时间顺序
// hasMore指示older events
```

### beforeId Cursor Pagination

```
before_id: firstId → events before cursor → older page navigation
// firstId作为cursor
// 获取older events
// 分页导航
```

### validateStatus Pattern

```
validateStatus: () => true → accept all status codes → handle in code
// 接受所有status code
// 在代码中处理
// 不让axios抛异常
```

## 借用价值

- ⭐⭐⭐⭐⭐ Auth context reuse pattern
- ⭐⭐⭐⭐⭐ anchor_to_latest pattern
- ⭐⭐⭐⭐⭐ beforeId cursor pagination
- ⭐⭐⭐⭐ HistoryPage type structure
- ⭐⭐⭐⭐ fetchPage generic function

## 来源

- Claude Code: `assistant/sessionHistory.ts`
- 分析报告: P47-1