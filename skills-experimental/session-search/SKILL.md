---
name: session-search
description: "AI-powered session search. Find relevant sessions by query. Search by title, tag, branch, summary, transcript. Semantic matching with Haiku. Use when [session search] is needed."
metadata:
  openclaw:
    emoji: "🔍"
    triggers: [session-search, find-history]
    feishuCard: true
---

# Session Search Skill - 会话搜索

使用 AI 搜索相关历史会话，语义匹配支持。

## 为什么需要这个？

**场景**：
- 查找历史会话
- 搜索相关对话
- 标签搜索
- 分支搜索
- 语义匹配

**Claude Code 方案**：agenticSessionSearch.ts + Haiku
**OpenClaw 飞书适配**：飞书会话搜索 + 轻量模型

---

## 搜索优先级

```
1. Exact tag matches（最高优先级）
2. Partial tag matches or tag-related terms
3. Title matches
4. Branch name matches
5. Summary and transcript content matches
6. Semantic similarity
```

---

## 搜索 Prompt

```
Your goal is to find relevant sessions based on a user's search query.

You will be given a list of sessions with their metadata and a search query.

Each session may include:
- Title
- Tag [tag: name]
- Branch [branch: name]
- Summary
- First message
- Transcript excerpt

CRITICAL: Be VERY inclusive in your matching. Include sessions that:
- Contain the query term anywhere
- Are semantically related
- Discuss related topics
- Have transcripts that mention the concept

Return JSON: {"relevant_indices": [2, 5, 0]}
```

---

## Transcript Extraction

```typescript
function extractTranscript(messages: Message[]): string {
  // Take messages from start and end
  const messagesToScan = messages.length <= MAX_MESSAGES_TO_SCAN
    ? messages
    : [
        ...messages.slice(0, MAX_MESSAGES_TO_SCAN / 2),
        ...messages.slice(-MAX_MESSAGES_TO_SCAN / 2)
      ]
  
  return messagesToScan
    .map(extractMessageText)
    .filter(Boolean)
    .join('\n')
    .slice(0, MAX_TRANSCRIPT_CHARS)
}
```

---

## 飞书卡片格式

### Search Results 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔍 Session Search Results**\n\n**Query**：\"testing\"\n\n---\n\n**找到 5 个相关会话**：\n\n**1. [tag: testing] Unit test refactoring**\n• **Branch**：claude/test-refactor\n• **Date**：2026-04-10\n• **Match**：Exact tag\n\n**2. Fix test failures in CI**\n• **Branch**：claude/fix-ci-tests\n• **Date**：2026-04-08\n• **Match**：Title\n\n**3. QA automation setup**\n• **Tag**：qa\n• **Date**：2026-04-05\n• **Match**：Semantic（testing → qa）\n\n---\n\n**选择会话恢复？**"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 提取 Session Metadata

```
Session Search:
1. 读取 memory/YYYY-MM-DD.md
2. 提取 title/tag/branch/summary
3. 提取 transcript excerpt
4. 构建 search payload
```

### 2. AI 搜索

```typescript
async function searchSessions(query: string): Promise<number[]> {
  const sessions = await loadSessionsMetadata()
  
  const payload = sessions.map(s => ({
    title: s.title,
    tag: s.tag,
    branch: s.branch,
    summary: s.summary,
    transcript: extractTranscript(s.messages)
  }))
  
  const result = await sideQuery({
    model: 'claude-haiku',
    system: SESSION_SEARCH_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(payload) }]
  })
  
  return result.relevant_indices
}
```

---

## 持久化存储

```json
// memory/session-search-state.json
{
  "searches": [
    {
      "query": "testing",
      "results": [2, 5, 0],
      "timestamp": "2026-04-12T00:00:00Z"
    }
  ],
  "stats": {
    "totalSearches": 0,
    "avgResultsPerSearch": 0
  },
  "config": {
    "maxSessionsToSearch": 100,
    "maxTranscriptChars": 2000,
    "maxMessagesToScan": 100
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| agenticSessionSearch.ts | Skill + AI |
| sideQuery with Haiku | 轻量模型 |
| Transcript extraction | memory/YYYY-MM-DD.md |
| loadFullLog | 读取 daily memory |
| Terminal UI | 飞书卡片结果 |

---

## 注意事项

1. **Very inclusive matching**：宁可多返回
2. **Transcript excerpt**：最多 2000 chars
3. **MAX_SESSIONS_TO_SEARCH**：100 个 session
4. **Semantic matching**：支持语义相关
5. **飞书卡片**：结果选择恢复

---

## 自动启用

此 Skill 在用户请求搜索会话时触发。

---

## 下一步增强

- Search analytics
- Query suggestions
- Auto-tagging based on search