# MCP Validation Skill

**优先级**: P30
**来源**: Claude Code `mcpValidation.ts`
**适用场景**: MCP输出token限制、截断处理

---

## 概述

MCP Validation处理MCP输出token限制，支持内容大小估算、截断处理。env: MAX_MCP_OUTPUT_TOKENS。

---

## 核心功能

### 1. Token上限

```typescript
const DEFAULT_MAX_MCP_OUTPUT_TOKENS = 25000

export function getMaxMcpOutputTokens(): number {
  const envValue = process.env.MAX_MCP_OUTPUT_TOKENS
  if (envValue) return parseInt(envValue, 10)
  return DEFAULT_MAX_MCP_OUTPUT_TOKENS
}
```

### 2. 内容估算

```typescript
const IMAGE_TOKEN_ESTIMATE = 1600
const MCP_TOKEN_COUNT_THRESHOLD_FACTOR = 0.5

export function getContentSizeEstimate(content: MCPToolResult): number {
  if (typeof content === 'string') {
    return roughTokenCountEstimation(content)
  }
  return content.reduce((total, block) => {
    if (isTextBlock(block)) {
      return total + roughTokenCountEstimation(block.text)
    } else if (isImageBlock(block)) {
      return total + IMAGE_TOKEN_ESTIMATE
    }
    return total
  }, 0)
}
```

### 3. 截断处理

```typescript
export async function truncateMCPToolResult(
  content: MCPToolResult
): Promise<MCPToolResult>
```

---

## OpenClaw应用

### 1. 飞书消息限制

```typescript
// 估算消息大小
const size = getContentSizeEstimate(message.content)

// 超限截断
if (size > getMaxMcpOutputTokens()) {
  const truncated = await truncateMCPToolResult(message.content)
  // 发送截断内容 + 提示
}
```

---

## 状态文件

```json
{
  "skill": "mcp-validation",
  "priority": "P30",
  "source": "mcpValidation.ts",
  "enabled": true,
  "defaultMaxTokens": 25000,
  "envVar": "MAX_MCP_OUTPUT_TOKENS",
  "createdAt": "2026-04-12T13:30:00Z"
}
```

---

## 参考

- Claude Code: `mcpValidation.ts`