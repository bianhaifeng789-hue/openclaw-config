---
name: summarization
description: "Automatic conversation summarization to handle token limits (borrowed from DeerFlow) Use when [summarization] is needed."
---

# Summarization - 对话摘要

**来源**: DeerFlow Summarization Middleware

## 核心概念

### Automatic Summarization

**用途**: 接近token限制时自动摘要旧消息

**机制**:
- Token-based triggers (4000 tokens)
- Message-based triggers (50 messages)
- Keep recent 20 messages intact
- Summarize older messages

### 关键参数

- `trigger_tokens`: 4000（触发阈值）
- `trigger_messages`: 50（消息数阈值）
- `keep_messages`: 20（保留最近消息）
- `trim_tokens_to_summarize`: 4000（摘要调用token限制）

## 实现

**脚本**: `impl/bin/summarization-middleware.js`

**状态文件**: `state/summarization-config.json`

## 使用方法

### 检查是否需要摘要

```bash
node impl/bin/summarization-middleware.js check '[{"role":"user","content":"test"}]' 5000
```

### 配置管理

```bash
# 查看配置
node impl/bin/summarization-middleware.js config

# 设置token触发阈值
node impl/bin/summarization-middleware.js set-trigger tokens 3000

# 设置消息触发阈值
node impl/bin/summarization-middleware.js set-trigger messages 40
```

## 借鉴要点

### DeerFlow Summarization特点

1. **多种触发器**
   - Token-based（推荐）
   - Message-based
   - Fraction-based（百分比）

2. **Token估算**
   - 使用tiktoken（cl100k_base）
   - 回退：len(text) // 4

3. **保留策略**
   - Keep recent N messages intact
   - AI/Tool message pairs保持连接

4. **模型选择**
   - 推荐轻量模型（gpt-4o-mini, claude-haiku）
   - 降低成本

## 与OpenClaw集成

### 心跳任务（新增）

```yaml
- name: summarization-check
  interval: 30m
  prompt: "Check conversation history. If needs summarization, trigger and update state."
```

### 压缩系统集成

与compact-cli.js协同工作：
- Summarization: 消息级别摘要
- Compact: 整体context压缩

---

_创建时间: 2026-04-15_