---
name: session-memory-compact
description: "Session Memory Compact - Compact MEMORY.md when it exceeds token limits. Preserve high-priority sections, compress low-priority ones. Use when [session memory compact] is needed."
metadata:
  openclaw:
    emoji: "🗜️"
    triggers: [heartbeat, compact]
    priority: high
    imports:
      - impl/utils/session-memory-compact.ts
      - impl/utils/session-memory-service.ts
---

# Session Memory Compact Skill

自动压缩 MEMORY.md 以保持在 token 上限内。

## 为什么需要

**问题**：
- MEMORY.md 随时间增长，可能超过 token 上限
- OpenClaw 的 compaction 机制不处理 MEMORY.md
- 需要保留关键信息，丢弃次要内容

**解决**：
- 借鉴 Claude Code 的 sessionMemoryCompact.ts
- 按优先级保留区块（Current Focus > Learnings > Notes）
- 压缩每个区块的内容（截断或摘要）

---

## 核心机制

### 1. 区块优先级

| 区块 | 优先级 | Max Tokens | 说明 |
|-----|-------|-----------|-----|
| Current Focus | high | 500 | 当前工作状态 |
| Key Decisions | high | 1000 | 重要决策 |
| User Profile | high | 1500 | 用户偏好 |
| Learnings | medium | 2000 | 经验教训 |
| Projects | medium | 1500 | 项目进展 |
| Contacts | low | 500 | 联系人 |
| Notes | low | 500 | 其他信息 |

### 2. 压缩流程

```
1. 估算当前 memory tokens
2. 如果超过 maxTokens (40,000):
   a. 按优先级排序区块
   b. 保留 high-priority 区块完整
   c. 压缩 medium-priority 区块
   d. 截断 low-priority 区块
3. 重新组装内容
4. 记录压缩统计
```

### 3. AUTO_UPDATE 区块保护

`<!-- AUTO_UPDATE: xxx -->` 区块由系统自动维护：
- Current Focus（AUTO_UPDATE）
- Key Decisions（AUTO_UPDATE）
- User Profile（AUTO_UPDATE）
- Learnings（AUTO_UPDATE）

手动编辑的区块不受影响：
- Contacts
- Notes（非 AUTO_UPDATE 部分）

---

## 使用方式

### 1. 手动压缩

```typescript
import { sessionMemoryCompact } from './session-memory-compact'

// 获取当前 MEMORY.md 内容
const memoryContent = await readMemoryFile()

// 压缩
const result = sessionMemoryCompact.compactMemoryContent(memoryContent)

console.log('Original:', result.originalTokens)
console.log('Compacted:', result.compactedTokens)
console.log('Reduction:', result.reductionRatio * 100 + '%')
console.log('Preserved:', result.preservedSections)
console.log('Compressed:', result.compressedSections)

// 写回
await writeMemoryFile(result.compactedContent)
```

### 2. Heartbeat 检查

```typescript
import { sessionMemoryCompact } from './session-memory-compact'

// 在 heartbeat 中检查
const state = sessionMemoryCompact.getCompactState()

// 如果上次压缩超过 24 小时
if (Date.now() - state.lastCompactAt > 24 * 60 * 60 * 1000) {
  const memoryContent = await readMemoryFile()
  const tokens = sessionMemoryCompact.estimateMemoryTokens(memoryContent)
  
  // 如果超过 maxTokens
  if (tokens > 40_000) {
    const result = sessionMemoryCompact.compactMemoryContent(memoryContent)
    await writeMemoryFile(result.compactedContent)
    
    // 发送飞书卡片通知
    await sendCompactNotification(result)
  }
}
```

### 3. 与 Session Memory Service 整合

```typescript
import { sessionMemoryService } from './session-memory-service'

// 检查是否需要提取
const shouldExtract = sessionMemoryService.shouldExtractMemory(
  currentTokenCount,
  toolCallsSinceLastUpdate,
  hasToolCallsInLastTurn
)

if (shouldExtract) {
  // 执行提取（使用 forked agent）
  const result = await sessionMemoryService.runMemoryExtraction(
    recentMessages,
    currentMemoryContent,
    (card) => message({ action: 'send', card })
  )
  
  // 如果提取后超过 maxTokens，压缩
  if (sessionMemoryCompact.estimateMemoryTokens(result.updatedContent) > 40_000) {
    const compacted = sessionMemoryCompact.compactMemoryContent(result.updatedContent)
    await writeMemoryFile(compacted.compactedContent)
  }
}
```

---

## Token 估算

### 英文内容
- 1 token ≈ 4 characters

### 中文内容
- 1 token ≈ 2 characters

### 混合内容
```typescript
// 自动检测中文比例并估算
const tokens = sessionMemoryCompact.estimateTokenCount(content)
```

---

## 借鉴 Claude Code

| Claude Code | OpenClaw |
|-------------|----------|
| `sessionMemoryCompact.ts` | `session-memory-compact.ts` |
| `compactSessionMemory()` | `compactMemoryContent()` |
| `hasTextBlocks()` | `hasTextBlocks()` |
| `minTokens: 10_000` | `minTokens: 10_000` |
| `maxTokens: 40_000` | `maxTokens: 40_000` |
| Session memory file | MEMORY.md |

---

## 配置

```yaml
sessionMemoryCompact:
  enabled: true
  minTokens: 10000      # 压缩后保留最小 tokens
  maxTokens: 40000      # 压缩后最大 tokens（硬上限）
  minTextBlockMessages: 5  # 保留的最小消息数
  compactInterval: 24h  # 压缩检查间隔
```

---

## 状态追踪

```json
{
  "lastCompactAt": 1703275200,
  "tokensBeforeCompact": 50000,
  "tokensAfterCompact": 35000,
  "compactCount": 5,
  "lastPreservedSections": ["Current Focus", "Key Decisions"],
  "lastCompressedSections": ["Learnings", "Projects", "Notes"]
}
```

---

## 飞书卡片通知

压缩完成后发送飞书卡片：

```
🗜️ Memory Compacted

原始: 50,000 tokens
压缩后: 35,000 tokens
减少: 30%

完整保留:
- Current Focus
- Key Decisions
- User Profile

压缩区块:
- Learnings (截断到 2000 tokens)
- Projects (截断到 1500 tokens)
- Notes (截断到 500 tokens)

[查看 MEMORY.md]
```

---

## 注意事项

1. **AUTO_UPDATE 区块**：由系统维护，压缩时会保留标记
2. **手动编辑内容**：尽量保留，只在必要时截断
3. **日期信息**：保留包含日期的行（便于追溯）
4. **状态标记**：保留 ✅/❌/🔄 开头的行
5. **压缩频率**：不要过度压缩，建议 24h 检查一次

---

## 与 OpenClaw Compaction 整合

OpenClaw 已有 compaction 机制：
- `agents.defaults.compaction.reserveTokensFloor`

Session Memory Compact 是补充：
- 只处理 MEMORY.md
- 不处理主会话上下文
- 在 heartbeat 中执行（独立于主 compaction）

---

## 下一步

1. 在 heartbeat 中添加 memory compact 检查
2. 与 session memory extraction 整合
3. 添加飞书卡片通知
4. 优化 token 估算精度

---

## 代码位置

- `impl/utils/session-memory-compact.ts` - Compaction 实现
- `impl/utils/session-memory-service.ts` - Memory 服务
- `skills/heartbeat-task-visualizer/SKILL.md` - Heartbeat 整合

---

## 参考资料

- Claude Code: `src/services/compact/sessionMemoryCompact.ts`
- Claude Code: `src/services/SessionMemory/sessionMemory.ts`
- Claude Code: `src/services/SessionMemory/prompts.ts`