---
name: extract-memories
description: "Extract durable memories from session transcripts Use when [extract memories] is needed."
triggers:
  - extract_memory
  - memory_extraction
  - durable_memory
metadata:
  openclaw:
    source: claude-code-pattern
    category: memory
    priority: high
---

# Extract Memories Service

借鉴 Claude Code extractMemories.ts，从会话中提取持久记忆。

## 核心功能

| 功能 | 说明 |
|------|------|
| extractFromSession | 从会话历史提取 |
| extractByType | 按类型提取 |
| getHighImportanceMemories | 获取高重要记忆 |
| generateMemoryCard | 飞书记忆卡片 |

## 记忆类型

| 类型 | 说明 |
|------|------|
| decision | 决策（高重要） |
| preference | 偏好 |
| progress | 进度 |
| insight | 洞察（高重要） |
| contact | 联系人 |
| project | 项目 |

## 使用示例

```typescript
import { extractMemoriesService } from './extract-memories-service.js'

// 从会话提取
const memories = extractMemoriesService.extractFromSession(messages)

// 生成飞书卡片
const card = extractMemoriesService.generateMemoryCard()
```