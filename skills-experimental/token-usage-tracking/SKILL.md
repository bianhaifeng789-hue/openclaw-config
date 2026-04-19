---
name: token-usage-tracking
description: Track LLM token usage per model call (input/output/total tokens) with cost calculation and budget monitoring. Prevents cost overruns and provides usage analytics. Use when monitoring LLM costs, tracking usage statistics, or configuring budget limits.
---

# Token Usage Tracking - LLM 成本监控

借鉴 DeerFlow 2.0 的 TokenUsageConfig 统计机制。

## Why This Matters

LLM API 调用会产生成本：
- 按使用量计费（input/output tokens）
- 频繁调用会累积高额成本
- 需要监控避免失控

**DeerFlow 机制**:
- `token_usage.enabled` - 启用统计
- `token_usage.log_level` - 日志级别
- Track per model call（input/output/total）

## Configuration

**gateway-config.yaml**:
```yaml
token_usage:
  enabled: true
  log_level: info  # Track LLM token usage per model call
```

## Implementation

**impl/bin/token-usage.js**:
```javascript
class TokenUsageTracker {
  constructor(config) {
    this.enabled = config.enabled;
    this.logLevel = config.log_level;
    
    // Usage stats
    this.totalTokens = 0;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.totalCalls = 0;
    
    // Model-specific stats
    this.modelStats = {};
    
    // Cost tracking
    this.costPerToken = {
      'bailian/glm-5': { input: 0.0001, output: 0.0001 },
      'openai/gpt-4o': { input: 0.005, output: 0.015 }
    };
  }
  
  track(model, inputTokens, outputTokens) {
    const totalTokens = inputTokens + outputTokens;
    
    // Update stats
    this.totalTokens += totalTokens;
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.totalCalls++;
    
    // Model-specific
    if (!this.modelStats[model]) {
      this.modelStats[model] = { ... };
    }
    this.modelStats[model].totalTokens += totalTokens;
    
    // Log
    console.log(`[token-usage] Model: ${model}, Input: ${inputTokens}, Output: ${outputTokens}`);
  }
  
  calculateCost(model, inputTokens, outputTokens) {
    const pricing = this.costPerToken[model];
    return inputTokens * pricing.input + outputTokens * pricing.output;
  }
}
```

## Usage

**LLM provider 包装**:
```javascript
const tracker = getTokenUsageTracker();

async function callLLM(model, prompt) {
  const response = await llm.invoke(prompt);
  
  // Track usage
  tracker.track(model, response.usage.input, response.usage.output);
  
  return response;
}
```

## Cost Tracking

**Pricing（参考）**:
| Model | Input (元/token) | Output (元/token) |
|-------|------------------|-------------------|
| bailian/glm-5 | 0.0001 | 0.0001 |
| openai/gpt-4o | 0.005 | 0.015 |
| anthropic/claude-3-5-sonnet | 0.003 | 0.015 |

**Cost calculation**:
```javascript
const cost = tracker.calculateCost('openai/gpt-4o', 500, 200);
// Input: 500 * 0.005 = 2.5 元
// Output: 200 * 0.015 = 3 元
// Total: 5.5 元
```

## Metrics

**Usage summary**:
```json
{
  "totalTokens": 1000,
  "totalInputTokens": 800,
  "totalOutputTokens": 200,
  "totalCalls": 5,
  "totalCost": "5.50",
  "avgTokensPerCall": 200,
  "modelStats": {
    "bailian/glm-5": {
      "totalTokens": 500,
      "totalCalls": 3,
      "avgTokens": 167
    },
    "openai/gpt-4o": {
      "totalTokens": 500,
      "totalCalls": 2,
      "avgTokens": 250
    }
  },
  "topModels": [...]
}
```

## Budget Monitoring

**Check budget**:
```javascript
const result = tracker.checkBudget(100);  // 100 元预算

if (result.exceeded) {
  console.warn(`⚠️ Budget exceeded: ${result.currentCost} >= ${result.budgetLimit}`);
  // Alert or throttle
}
```

## Commands

**Summary**:
```bash
node impl/bin/token-usage.js summary
```

**Track usage**:
```bash
node impl/bin/token-usage.js track bailian/glm-5 100 50
```

**Budget check**:
```bash
node impl/bin/token-usage.js budget 100
```

**Reset**:
```bash
node impl/bin/token-usage.js reset
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Cost Awareness** | Know how much LLM costs |
| **Usage Analytics** | Understand usage patterns |
| **Budget Control** | Prevent cost overruns |
| **Model Comparison** | Compare model efficiency |

## Borrowed From

DeerFlow 2.0 - `backend/packages/harness/deerflow/config/token_usage_config.py`

```python
class TokenUsageConfig(BaseModel):
    enabled: bool = Field(default=False)
```

---

_创建时间: 2026-04-15_
_借鉴来源: https://github.com/bytedance/deer-flow_