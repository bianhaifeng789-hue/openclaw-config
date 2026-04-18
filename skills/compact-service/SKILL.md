# Compact Service Skill

对话压缩服务核心逻辑 - 生成摘要保留recent history，PTL重试作为安全阀。

## 功能概述

从Claude Code的compact.ts提取的对话压缩模式，用于OpenClaw的长对话管理。

## 核心机制

### 预处理

```typescript
stripImagesFromMessages(messages)  // [image]/[document]标记
stripReinjectedAttachments(messages)  // 移除skill_discovery/skill_listing
```

### PTL Retry（Prompt Too Long Escape Hatch）

CC-1180的最后防线 - 当compact请求本身超长时truncate最老内容：

```typescript
truncateHeadForPTLRetry(messages, ptlResponse):
  // 按API-round分组
  // 计算tokenGap从PTL error
  // 丢弃最老groups直到覆盖gap
  // 最大3次retry
  // 合成user marker: '[earlier conversation truncated for compaction retry]'
```

### Prompt Cache Sharing

默认启用，98%命中率：

```typescript
promptCacheSharingEnabled = getFeatureValue_CACHED_MAY_BE_STALE(
  'tengu_compact_cache_prefix', 
  true
)
```

### Post-Compact Restore Budget

```typescript
POST_COMPACT_MAX_FILES_TO_RESTORE = 5
POST_COMPACT_TOKEN_BUDGET = 50_000
POST_COMPACT_MAX_TOKENS_PER_FILE = 5_000
POST_COMPACT_MAX_TOKENS_PER_SKILL = 5_000
POST_COMPACT_SKILLS_TOKEN_BUDGET = 25_000
```

### 技能截断

保留头部，标记截断：

```typescript
SKILL_TRUNCATION_MARKER = '[... skill content truncated; use Read if needed]'
truncateToTokens(content, maxTokens)  // ~4 chars/token估算
```

### 边界标记

```typescript
createCompactBoundaryMessage(trigger, preCompactTokens, lastUuid)
compactMetadata: {
  preCompactDiscoveredTools: [...],
  preservedSegment: { headUuid, anchorUuid, tailUuid }
}
```

### Partial Compact方向

- `'from'`: 从pivot向后摘要，保留前部（cache prefix保留）
- `'up_to'`: 到pivot向前摘要，保留尾部（cache失效）

## 实现建议

### OpenClaw适配

1. **触发**: 可用autoCompact的threshold计算
2. **摘要生成**: forked agent with cache-safe params
3. **PTL retry**: 安全阀防止用户卡住
4. **restore**: 重新注入关键文件/Skills

### 状态文件示例

```json
{
  "preCompactTokens": 95000,
  "threshold": 80000,
  "trigger": "auto",
  "filesRestored": ["MEMORY.md", "AGENTS.md"],
  "ptlRetryCount": 0
}
```

## 关键模式

### Circuit Breaker

autoCompact.ts中的熔断器 - 连续失败时暂停自动压缩。

### Delta Attachments

重新注入：
- deferred-tools delta
- agent-listing delta
- mcp-instructions delta

## 借用价值

- ⭐⭐⭐⭐⭐ PTL Retry是关键安全阀
- ⭐⭐⭐⭐ Cache prefix节省大量成本
- ⭐⭐⭐⭐ Budget-based restore控制成本

## 来源

- Claude Code: `services/compact/compact.ts`
- 分析报告: P33-2