---
name: model-routing-system
description: |
  Model selection and routing system. Resolve model aliases (sonnet/opus/haiku), handle provider-specific model IDs, priority-based model selection.
  
  Use when:
  - Selecting which model to use for a task
  - Resolving model aliases to actual model IDs
  - Switching between providers (firstParty/Bedrock/Vertex)
  - Choosing small/fast model for auxiliary tasks
  
  Keywords: model selection, model alias, sonnet, opus, haiku, model routing, provider
metadata:
  openclaw:
    emoji: "🧭"
    source: claude-code-model-routing
    triggers: [model-selection, model-alias, provider-routing]
    priority: P1
---

# Model Routing System

基于 Claude Code `utils/model/` 的模型选择和路由系统。

## 模型别名（来自 Claude Code）

```typescript
const MODEL_ALIASES = ['sonnet', 'opus', 'haiku', 'best', 'sonnet[1m]', 'opus[1m]', 'opusplan']
```

| 别名 | 解析为 |
|------|--------|
| `sonnet` | claude-sonnet-4-6 |
| `opus` | claude-opus-4-6 |
| `haiku` | claude-haiku-4-5-20251001 |
| `best` | claude-opus-4-6 |
| `sonnet[1m]` | claude-sonnet-4-6（1M context） |
| `opusplan` | claude-opus-4-6（plan 模式专用） |

## 模型配置（来自 Claude Code configs.ts）

```typescript
// 最新模型配置
const CLAUDE_SONNET_4_6_CONFIG = {
  firstParty: 'claude-sonnet-4-6',
  bedrock: 'us.anthropic.claude-sonnet-4-6',
  vertex: 'claude-sonnet-4-6',
  foundry: 'claude-sonnet-4-6',
}

const CLAUDE_OPUS_4_6_CONFIG = {
  firstParty: 'claude-opus-4-6',
  bedrock: 'us.anthropic.claude-opus-4-6-v1',
  vertex: 'claude-opus-4-6',
  foundry: 'claude-opus-4-6',
}

const CLAUDE_HAIKU_4_5_CONFIG = {
  firstParty: 'claude-haiku-4-5-20251001',
  bedrock: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
  vertex: 'claude-haiku-4-5@20251001',
  foundry: 'claude-haiku-4-5',
}
```

## 模型选择优先级（来自 Claude Code）

```
1. 会话内 /model 命令覆盖（最高优先级）
2. 启动时 --model 参数
3. ANTHROPIC_MODEL 环境变量
4. 用户设置（settings.json）
5. 内置默认值（最低优先级）
```

## 任务类型 → 模型映射

```
主对话循环:     getMainLoopModel()    → sonnet-4-6（默认）
最佳质量:       getBestModel()        → opus-4-6
小型快速任务:   getSmallFastModel()   → haiku-4-5（或 ANTHROPIC_SMALL_FAST_MODEL）
```

### 小型快速模型的使用场景
- Tool use summary（工具调用摘要标签）
- Prompt suggestion（下一步建议）
- Side query（辅助判断）
- Auto-classifier（权限分类）
- Away summary（离开摘要）

## OpenClaw 适配实现

### 模型解析

```javascript
const MODEL_MAP = {
  'sonnet': 'anthropic/claude-sonnet-4-6',
  'opus': 'anthropic/claude-opus-4-6',
  'haiku': 'anthropic/claude-haiku-4-5-20251001',
  'best': 'anthropic/claude-opus-4-6',
  'small': 'anthropic/claude-haiku-4-5-20251001',
}

function resolveModel(alias) {
  return MODEL_MAP[alias] ?? alias
}
```

### 任务路由

```javascript
function getModelForTask(taskType) {
  switch (taskType) {
    case 'main':        return resolveModel('sonnet')
    case 'best':        return resolveModel('opus')
    case 'summary':     return resolveModel('haiku')
    case 'suggestion':  return resolveModel('haiku')
    case 'classifier':  return resolveModel('haiku')
    default:            return resolveModel('sonnet')
  }
}
```

### OpenClaw 配置格式

```json
// openclaw.json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-sonnet-4-6"
    }
  },
  "providers": {
    "anthropic": {
      "baseUrl": "https://api.mountsea.ai/chat/claude",
      "api": "anthropic-messages",
      "apiKey": "..."
    }
  }
}
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| Provider | firstParty/Bedrock/Vertex/Foundry | anthropic/openai/bailian |
| 模型格式 | `claude-sonnet-4-6` | `anthropic/claude-sonnet-4-6` |
| 1M context | 支持（[1m] 后缀） | 取决于 provider |
| Fast mode | 有（切换到更快模型） | 无 |
| opusplan | plan 模式自动切 opus | 不实现 |
