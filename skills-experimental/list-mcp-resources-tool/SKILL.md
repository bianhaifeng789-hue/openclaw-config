# List MCP Resources Tool Skill

MCP资源列表工具 - LRU cache + ensureConnectedClient + Filter by server + Graceful error。

## 功能概述

从Claude Code的ListMcpResourcesTool提取的MCP资源列表模式，用于OpenClaw的MCP资源发现。

## 核心机制

### LRU Cache (Startup Prefetch)

```typescript
// fetchResourcesForClient is LRU-cached (by server name) and already warm from startup prefetch
// Cache is invalidated on onclose and on resources/list_changed notifications
// ensureConnectedClient is a no-op when healthy (memoize hit)
const fresh = await ensureConnectedClient(client)
return await fetchResourcesForClient(fresh)
// 启动时prefetch warm
// onclose/list_changed → invalidate
// healthy → memoize hit (no-op)
```

### Server Filter

```typescript
const clientsToProcess = targetServer
  ? mcpClients.filter(client => client.name === targetServer)
  : mcpClients
// Optional server filter
// 按server name过滤
```

### Graceful Error (One Server Fail)

```typescript
const results = await Promise.all(
  clientsToProcess.map(async client => {
    if (client.type !== 'connected') return []
    try {
      const fresh = await ensureConnectedClient(client)
      return await fetchResourcesForClient(fresh)
    } catch (error) {
      // One server's reconnect failure shouldn't sink the whole result.
      logMCPError(client.name, errorMessage(error))
      return []  // return empty, not throw
    }
  })
)
// 一个server失败 → 返回[]
// 不影响其他servers
```

### No Resources Message

```typescript
if (!content || content.length === 0) {
  return {
    content: 'No resources found. MCP servers may still provide tools even if they have no resources.'
  }
}
// 无resources → 提示可能仍有tools
// 不只是空白
```

### Truncation Detection

```typescript
isResultTruncated(output: Output): boolean {
  return isOutputLineTruncated(jsonStringify(output))
}
// 检测输出截断
// 防止信息丢失
```

## 实现建议

### OpenClaw适配

1. **lruCache**: LRU cache
2. **serverFilter**: Server filter
3. **gracefulError**: Graceful error
4. **truncationDetect**: Truncation detection

### 状态文件示例

```json
{
  "serversProcessed": 3,
  "resourcesFound": 15,
  "cacheHits": 2,
  "errors": 1,
  "truncated": false
}
```

## 关键模式

### LRU + Invalidate

```
startup prefetch warm + onclose/list_changed invalidate
// 快速响应
// 保持fresh
```

### One Server Fail Pattern

```
try { fetch } catch { return [] }
// 不sink整个result
// 其他servers正常返回
```

### No Resources Message

```
"No resources found. MCP servers may still provide tools..."
// 有意义的空结果
// 不让model panic
```

### Truncation Detection

```
isOutputLineTruncated(jsonStringify(output))
// 检测截断
// UI处理
```

## 借用价值

- ⭐⭐⭐⭐⭐ LRU cache + invalidate pattern
- ⭐⭐⭐⭐⭐ One server fail → graceful
- ⭐⭐⭐⭐ Server filter optional
- ⭐⭐⭐⭐ No resources message

## 来源

- Claude Code: `tools/ListMcpResourcesTool/ListMcpResourcesTool.ts` (4KB+)
- 分析报告: P38-33