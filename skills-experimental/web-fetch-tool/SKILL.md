# Web Fetch Tool Skill

网页抓取工具 - Preapproved hosts + Redirect handling + Content type dispatch。

## 功能概述

从Claude Code的WebFetchTool提取的HTTP抓取模式，用于OpenClaw的网页内容获取。

## 核心机制

### Preapproved Hosts

```typescript
function isPreapprovedHost(hostname: string, pathname: string): boolean {
  // 预批准的域名列表
  // 无需permission即可抓取
}

if (isPreapprovedHost(parsedUrl.hostname, parsedUrl.pathname)) {
  return { behavior: 'allow', decisionReason: { type: 'other', reason: 'Preapproved host' } }
}
// 常见文档域名预批准
// 减少permission prompts
```

### Redirect Handling

```typescript
if (response.type === 'redirect') {
  return {
    result: `REDIRECT DETECTED: URL redirects to different host.
Original: ${response.originalUrl}
Redirect: ${response.redirectUrl}
Status: ${response.statusCode}

Please use WebFetch again with: url: "${response.redirectUrl}"`
  }
}
// 跨域名redirect → 返回提示
// 让model重新请求
// 防止permission bypass
```

### Content Type Dispatch

```typescript
if (contentType.includes('text/markdown') && content.length < MAX_MARKDOWN_LENGTH) {
  result = content  // 直接返回
} else {
  result = await applyPromptToMarkdown(prompt, content, ...)  // 用Haiku总结
}
// Markdown短内容 → 直接返回
// 其他 → prompt处理
```

### Persisted Binary

```typescript
if (persistedPath) {
  result += `\n\n[Binary content (${contentType}, ${formatFileSize(bytes)}) saved to ${persistedPath}]`
}
// PDF等binary → 保存到disk
// 返回路径提示
```

### Domain Permission Rule

```typescript
function webFetchToolInputToPermissionRuleContent(input): string {
  const { url } = parsedInput.data
  const hostname = new URL(url).hostname
  return `domain:${hostname}`
}
// Permission rule按domain匹配
// 不是完整URL
```

### Auth Warning in Prompt

```typescript
return `IMPORTANT: WebFetch WILL FAIL for authenticated or private URLs.
Before using, check if URL points to authenticated service (Google Docs, Confluence, etc).
Look for specialized MCP tool.`
// 提醒private URL会失败
// 推荐MCP tool
```

### Duration Tracking

```typescript
const start = Date.now()
const response = await getURLMarkdownContent(url, ...)
const output = {
  bytes, code, codeText, result,
  durationMs: Date.now() - start,
  url
}
// 与GlobTool相同的duration tracking
```

## 实现建议

### OpenClaw适配

1. **preapproved**: 预批准域名
2. **redirect**: Redirect处理
3. **contentType**: 内容类型分发
4. **domainRule**: Domain permission

### 状态文件示例

```json
{
  "url": "https://example.com",
  "preapproved": false,
  "contentType": "text/html",
  "bytes": 50000,
  "durationMs": 120,
  "redirect": false
}
```

## 关键模式

### Preapproved Hosts

```
Known domains → auto-allow, no prompt
// 减少用户交互
// 常见文档站点
```

### Cross-domain Redirect

```
Redirect to different host → return message → model re-request
// Permission isolation
// 不自动follow跨域名
```

### Content Type Dispatch

```
Markdown + short → direct return
Other → Haiku summary via prompt
// 按类型优化处理
```

## 借用价值

- ⭐⭐⭐⭐⭐ Preapproved hosts pattern
- ⭐⭐⭐⭐⭐ Cross-domain redirect handling
- ⭐⭐⭐⭐ Content type dispatch
- ⭐⭐⭐⭐ Domain-based permission rules
- ⭐⭐⭐⭐ Auth warning in prompt

## 来源

- Claude Code: `tools/WebFetchTool/WebFetchTool.ts` (8KB+)
- 分析报告: P38-19