# Web Search Tool Skill

网页搜索工具 - Provider enable + Streaming events + Progress counter + Citation format。

## 功能概述

从Claude Code的WebSearchTool提取的Web搜索模式，用于OpenClaw的实时信息获取。

## 核心机制

### Provider-specific Enable

```typescript
isEnabled() {
  const provider = getAPIProvider()
  const model = getMainLoopModel()
  
  if (provider === 'firstParty') return true
  if (provider === 'vertex') {
    return model.includes('claude-opus-4') || model.includes('claude-sonnet-4')
  }
  if (provider === 'foundry') return true
  return false
}
// 按provider和model启用
// Vertex需要特定model
```

### Streaming Event Processing

```typescript
for await (const event of queryStream) {
  if (event.type === 'assistant') {
    allContentBlocks.push(...event.message.content)
  }
  
  if (event.type === 'stream_event' && event.event?.type === 'content_block_start') {
    if (contentBlock.type === 'server_tool_use') {
      currentToolUseId = contentBlock.id
    }
  }
  
  if (event.event?.type === 'content_block_delta') {
    if (delta?.type === 'input_json_delta') {
      currentToolUseJson += delta.partial_json
    }
  }
}
// 处理多种event类型
// 累积partial JSON
```

### Progress Counter Pattern

```typescript
let progressCounter = 0
const toolUseQueries = new Map()

// Query update
toolUseQueries.set(currentToolUseId, query)
progressCounter++
onProgress({ toolUseID: `search-progress-${progressCounter}`, data: { type: 'query_update', query } })

// Results received
progressCounter++
onProgress({ toolUseID: toolUseId, data: { type: 'search_results_received', resultCount: content.length } })
// 递增counter
// 区分query_update和results_received
```

### Output Parsing

```typescript
function makeOutputFromSearchResponse(result, query, durationSeconds) {
  const results = []
  let textAcc = ''
  let inText = true
  
  for (const block of result) {
    if (block.type === 'server_tool_use') { inText = false; continue }
    if (block.type === 'web_search_tool_result') {
      if (!Array.isArray(block.content)) {
        results.push(`Web search error: ${block.content.error_code}`)
      } else {
        results.push({ tool_use_id, content: hits })
      }
    }
    if (block.type === 'text') { ... }
  }
  return { query, results, durationSeconds }
}
// 解析mixed blocks
// 处理error case
```

### Domain Filters

```typescript
z.strictObject({
  query: z.string().min(2),
  allowed_domains: z.array(z.string()).optional(),
  blocked_domains: z.array(z.string()).optional()
})

// Validation
if (allowed_domains?.length && blocked_domains?.length) {
  return { result: false, message: 'Cannot specify both', errorCode: 2 }
}
// allowed + blocked不能同时
```

### Citation Format

```typescript
formattedOutput += '\nREMINDER: You MUST include the sources above using markdown hyperlinks.'
// 强制citation
// Markdown hyperlink格式
```

### Haiku Fast Model

```typescript
const useHaiku = getFeatureValue('tengu_plum_vx3', false)
const model = useHaiku ? getSmallFastModel() : context.options.mainLoopModel
// Feature gate切换model
// Haiku更快
```

## 实现建议

### OpenClaw适配

1. **providerEnable**: Provider启用逻辑
2. **streaming**: Streaming处理
3. **progress**: Progress通知
4. **citation**: Citation强制

### 状态文件示例

```json
{
  "provider": "firstParty",
  "enabled": true,
  "query": "example",
  "durationSeconds": 2.5,
  "resultCount": 8,
  "citationRequired": true
}
```

## 关键模式

### Provider-specific Enable

```
firstParty → always enable
vertex → specific models only
foundry → always enable
others → disable
```

### Streaming Event Accumulation

```
assistant → accumulate content
content_block_start → track tool_use_id
content_block_delta → accumulate partial_json
web_search_tool_result → emit progress
```

### Citation Enforcement

```
Return results → Append citation reminder
// 强制引用来源
// 防止plagiarism
```

## 借用价值

- ⭐⭐⭐⭐⭐ Provider-specific enable logic
- ⭐⭐⭐⭐⭐ Streaming event processing
- ⭐⭐⭐⭐ Progress counter pattern
- ⭐⭐⭐⭐ Domain filter validation
- ⭐⭐⭐⭐ Citation enforcement

## 来源

- Claude Code: `tools/WebSearchTool/WebSearchTool.ts` (10KB+)
- 分析报告: P38-21