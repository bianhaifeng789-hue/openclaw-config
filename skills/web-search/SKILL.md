---
name: web-search
description: "Search the web for current information. Always include Sources section with markdown hyperlinks. Use when: user asks about current events, recent documentation, needs up-to-date info."
metadata:
  openclaw:
    emoji: "🌐"
    triggers: [web-search-request, current-info]
    feishuCard: true
---

# Web Search Skill - 网络搜索

搜索网络获取最新信息，必须包含 Sources 列表。

## 为什么需要这个？

**场景**：
- 查询最新事件
- 搜索最新文档
- 获取实时数据
- 验证信息准确性

**Claude Code 方案**：WebSearchTool + 强制 Sources
**OpenClaw 飞书适配**：集成搜索 API + 飞书链接展示

---

## 关键要求

### MUST: Sources Section

**强制要求**：
- 回答后必须包含 Sources section
- Sources 格式：markdown 超链接 `[Title](URL)`
- 所有相关 URL 都要列出

```
正确格式：

[回答内容]

Sources:
- [React Documentation](https://react.dev)
- [MDN Web Docs](https://developer.mozilla.org)
```

---

## 搜索引擎选择

### DuckDuckGo（推荐）

- 无需 API key
- 免费、隐私友好
- 适合大多数场景

### Google Custom Search

- 需要 API key
- 搜索质量高
- 有 quota 限制

### Bing Search

- 需要 API key
- Microsoft 提供
- 有 quota 限制

---

## 飞书卡片格式

### 搜索结果卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🌐 搜索结果**\n\n**查询**：React 18 新特性\n\n**回答**：\nReact 18 引入了 Concurrent Rendering...\n\n**Sources**：\n• [React 18 Release Notes](https://react.dev/blog/2022/03/29/react-v18)\n• [React Documentation](https://react.dev)\n• [MDN Web Docs](https://developer.mozilla.org)"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 解析用户查询

```
Agent:
1. 检测用户需要实时信息
2. 构造搜索 query（使用当前年份）
3. 选择搜索引擎
4. 执行搜索
```

### 2. 执行搜索

```typescript
async function searchWeb(query: string): Promise<SearchResult[]> {
  // DuckDuckGo 无需 API key
  const response = await fetch(`https://api.duckduckgo.com/?q=${query}&format=json`)
  
  // 或使用其他搜索 API
  const results = parseSearchResults(response)
  
  return results
}
```

### 3. 格式化结果

```
Agent:
1. 解析搜索结果
2. 生成回答内容
3. 提取相关 URL
4. 格式化 Sources section
5. 发送飞书卡片
```

---

## 年份要求

**重要**：搜索时使用当前年份

```
错误：
用户：最新 React 文档
搜索：React documentation  # 可能返回旧文档

正确：
用户：最新 React 文档
搜索：React documentation 2026  # 返回当前文档
```

---

## Domain Filtering

支持域名过滤：

```typescript
interface SearchOptions {
  query: string
  includeDomains?: string[]  // 只包含这些域名
  excludeDomains?: string[]  // 排除这些域名
}
```

**示例**：
```typescript
// 只搜索官方文档
searchWeb({
  query: "React hooks",
  includeDomains: ["react.dev", "facebook.github.io"]
})

// 排除某些网站
searchWeb({
  query: "Node.js tutorial",
  excludeDomains: ["example.com"]
})
```

---

## 持久化存储

```json
// memory/web-search-state.json
{
  "searchesPerformed": [
    {
      "id": "search-1",
      "query": "React 18 新特性 2026",
      "resultsCount": 5,
      "sources": [
        "https://react.dev/blog/2022/03/29/react-v18",
        "https://react.dev"
      ],
      "timestamp": "2026-04-11T23:00:00Z"
    }
  ],
  "stats": {
    "searchesPerformed": 0,
    "totalResults": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| WebSearchTool | Skill + 搜索 API |
| 强制 Sources | 同样强制 |
| Domain filtering | 同样支持 |
| Terminal UI | 飞书卡片链接 |
| currentMonthYear | 使用当前年份 |

---

## 注意事项

1. **Sources 必须**：回答后必须包含 Sources
2. **使用当前年份**：搜索时加上年份
3. **链接格式**：markdown 超链接 `[Title](URL)`
4. **域名过滤**：可选使用
5. **结果数量**：控制返回结果数（避免过多）

---

## 自动启用

此 Skill 在检测到需要实时信息时自动触发。

---

## 下一步增强

- 搜索历史记录
- 搜索结果缓存
- 多搜索引擎对比
- 搜索质量评估