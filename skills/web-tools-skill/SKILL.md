---
name: web-tools-skill
description: |
  Web fetch and web search tools for retrieving and analyzing online content.
  
  Use when:
  - User asks to fetch/read a URL or webpage
  - User asks to search the web for information
  - Need to retrieve documentation, articles, or API references
  - Checking current information not in training data
  
  Keywords: fetch URL, web search, browse, read webpage, search internet, look up online
metadata:
  openclaw:
    emoji: "🌐"
    source: claude-code-web-tools
    triggers: [web-fetch, web-search, url, browse]
    priority: P1
---

# Web Tools Skill

基于 Claude Code `WebFetchTool` + `WebSearchTool` 的网页获取和搜索工具。

## WebFetch（网页获取）

### 核心特性（来自 Claude Code）
- 获取 URL 内容，HTML → Markdown 转换
- **15 分钟缓存**：同一 URL 重复访问直接返回缓存
- 二次模型处理：用小模型对内容应用 prompt，提取关键信息
- HTTP 自动升级到 HTTPS
- 重定向处理：遇到跨域重定向时告知用户新 URL
- GitHub URL 建议用 `gh` CLI 替代

### 输入
```
url: string    // 完整 URL（含 https://）
prompt: string // 要从页面提取什么信息
```

### 输出
```
bytes: number      // 内容大小
code: number       // HTTP 状态码
result: string     // 模型处理后的结果
durationMs: number // 耗时
url: string        // 实际 URL（可能经过重定向）
```

### OpenClaw 实现

使用内置 `web_fetch` 工具：
```
1. 调用 web_fetch(url)
2. 获取 markdown 内容
3. 根据 prompt 提取关键信息
4. 返回处理结果
```

**缓存实现**：
```json
// memory/web-fetch-cache.json
{
  "https://example.com": {
    "content": "...",
    "fetchedAt": 1713000000000,
    "ttlMs": 900000
  }
}
```

### 预批准域名（无需权限确认）
- docs.anthropic.com
- github.com
- npmjs.com
- developer.mozilla.org
- stackoverflow.com

---

## WebSearch（网页搜索）

### 核心特性（来自 Claude Code）
- 使用 Anthropic 原生 web search beta API
- 支持 `allowed_domains` / `blocked_domains` 过滤
- 返回搜索结果列表（title + url）
- 用小模型处理搜索结果，提取答案

### 输入
```
query: string              // 搜索查询（最少 2 字符）
allowed_domains?: string[] // 只从这些域名返回结果
blocked_domains?: string[] // 排除这些域名
```

### OpenClaw 实现

优先使用 MCP 提供的 web search 工具（如果可用），否则：
1. 使用 `web_fetch` 搜索 DuckDuckGo/Bing
2. 解析搜索结果页面
3. 返回 top 5 结果

### 使用示例

```
用户: "搜索 OpenClaw 最新版本"
→ 调用 WebSearch(query="OpenClaw latest version")
→ 返回相关链接和摘要

用户: "读取 https://docs.openclaw.ai/introduction"
→ 调用 WebFetch(url="...", prompt="提取主要功能介绍")
→ 返回处理后的内容摘要
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| WebFetch 缓存 | 内存 15 分钟 | 文件缓存（memory/web-fetch-cache.json） |
| WebSearch | Anthropic beta API | MCP 工具 / DuckDuckGo fallback |
| 权限检查 | 域名白名单 | 直接执行（信任用户） |
| 内容处理 | Haiku 二次处理 | 主模型直接处理 |
