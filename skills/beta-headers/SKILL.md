---
name: beta-headers
description: "Beta headers support. 15+ beta headers. Provider-specific headers (1P/3P). Bedrock extra params. Vertex count tokens allowed betas. Feature gating. Use when [beta headers] is needed."
metadata:
  openclaw:
    emoji: "🧪"
    triggers: [api-request, beta-feature]
    feishuCard: true
---

# Beta Headers Skill - Beta Headers 支持

Beta headers 支持，用于启用 beta 功能。

## 为什么需要这个？

**场景**：
- 启用 beta 功能
- Provider-specific headers
- Feature gating
- API beta 支持
- 新功能测试

**Claude Code 方案**：betas.ts + 15+ headers
**OpenClaw 飞书适配**：Beta headers + Feature gates

---

## Beta Headers List

```typescript
// Core beta headers
const CLAUDE_CODE_20250219_BETA_HEADER = 'claude-code-20250219'
const INTERLEAVED_THINKING_BETA_HEADER = 'interleaved-thinking-2025-05-14'
const CONTEXT_1M_BETA_HEADER = 'context-1m-2025-08-07'
const CONTEXT_MANAGEMENT_BETA_HEADER = 'context-management-2025-06-27'
const STRUCTURED_OUTPUTS_BETA_HEADER = 'structured-outputs-2025-12-15'
const WEB_SEARCH_BETA_HEADER = 'web-search-2025-03-05'

// Tool search beta headers (provider-specific)
const TOOL_SEARCH_BETA_HEADER_1P = 'advanced-tool-use-2025-11-20'
const TOOL_SEARCH_BETA_HEADER_3P = 'tool-search-tool-2025-10-19'

// Other beta headers
const EFFORT_BETA_HEADER = 'effort-2025-11-24'
const TASK_BUDGETS_BETA_HEADER = 'task-budgets-2026-03-13'
const FAST_MODE_BETA_HEADER = 'fast-mode-2026-02-01'
const REDACT_THINKING_BETA_HEADER = 'redact-thinking-2026-02-12'
const TOKEN_EFFICIENT_TOOLS_BETA_HEADER = 'token-efficient-tools-2026-03-28'
const AFK_MODE_BETA_HEADER = 'afk-mode-2026-01-31'
const CLI_INTERNAL_BETA_HEADER = 'cli-internal-2026-02-09'  // ant-only
const ADVISOR_BETA_HEADER = 'advisor-tool-2026-03-01'
```

---

## Provider-Specific

### 1. Bedrock Extra Params

```typescript
const BEDROCK_EXTRA_PARAMS_HEADERS = new Set([
  INTERLEAVED_THINKING_BETA_HEADER,
  CONTEXT_1M_BETA_HEADER,
  TOOL_SEARCH_BETA_HEADER_3P,
])
```

### 2. Vertex Count Tokens

```typescript
const VERTEX_COUNT_TOKENS_ALLOWED_BETAS = new Set([
  CLAUDE_CODE_20250219_BETA_HEADER,
  INTERLEAVED_THINKING_BETA_HEADER,
  CONTEXT_MANAGEMENT_BETA_HEADER,
])
```

---

## 使用示例

### 1. Get Betas for Model

```typescript
function getModelBetas(model: string, provider: string): string[] {
  const betas: string[] = []
  
  // Core beta
  betas.push(CLAUDE_CODE_20250219_BETA_HEADER)
  
  // Interleaved thinking
  betas.push(INTERLEAVED_THINKING_BETA_HEADER)
  
  // Tool search (provider-specific)
  if (provider === 'anthropic') {
    betas.push(TOOL_SEARCH_BETA_HEADER_1P)
  } else {
    betas.push(TOOL_SEARCH_BETA_HEADER_3P)
  }
  
  // Context 1M (if model supports)
  if (modelSupports1M(model)) {
    betas.push(CONTEXT_1M_BETA_HEADER)
  }
  
  return betas
}
```

---

## 飞书卡片格式

### Beta Headers Status 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🧪 Beta Headers**\n\n---\n\n**启用 Beta Headers**：\n\n| Beta Header | 版本 | 状态 |\n|-------------|------|------|\n| claude-code-20250219 | 2025-02-19 | ✓ |\n| interleaved-thinking | 2025-05-14 | ✓ |\n| context-1m | 2025-08-07 | ✓ |\n| tool-search-1P | 2025-11-20 | ✓ |\n| effort | 2025-11-24 | ✓ |\n| fast-mode | 2026-02-01 | ✓ |\n\n---\n\n**Provider-Specific**：\n• 1P: advanced-tool-use-2025-11-20\n• 3P: tool-search-tool-2025-10-19\n\n---\n\n**总计 Beta Headers**：15+"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/beta-headers-state.json
{
  "enabledBetas": [],
  "stats": {
    "totalRequests": 0,
    "betaFeaturesUsed": {}
  },
  "headers": {
    "core": ["claude-code-20250219", "interleaved-thinking-2025-05-14"],
    "provider1P": "advanced-tool-use-2025-11-20",
    "provider3P": "tool-search-tool-2025-10-19",
    "context1M": "context-1m-2025-08-07",
    "toolSearch": "advanced-tool-use-2025-11-20"
  },
  "lastUpdate": "2026-04-12T00:43:00Z",
  "notes": "Beta Headers Skill 创建完成。等待 API request 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| betas.ts | Skill + Headers |
| 15+ headers | 同样 headers |
| Provider-specific | 1P/3P 区分 |
| BEDROCK_EXTRA_PARAMS | Bedrock support |
| VERTEX_COUNT_TOKENS | Vertex support |

---

## 注意事项

1. **Provider-specific**：1P vs 3P headers
2. **Bedrock**：Extra params set
3. **Vertex**：Count tokens allowed
4. **Ant-only**：CLI_INTERNAL_BETA_HEADER
5. **Feature gating**：Beta 启用新功能

---

## 自动启用

此 Skill 在 API request 时自动添加 headers。

---

## 下一步增强

- 飞书 beta 支持
- Beta analytics
- Feature tracking