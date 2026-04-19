---
name: sse-streaming
description: "Real-time progress updates via SSE-like streaming (borrowed from DeerFlow) Use when [sse streaming] is needed."
---

# SSE Streaming

**来源**: DeerFlow LangGraph SSE streaming

## 核心概念

### SSE (Server-Sent Events)

**用途**: 实时推送任务进度，防止用户以为掉线

**机制**:
- 每2秒检查是否需要更新
- 每25%进度发送飞书卡片
- 动态进度消息

### 关键参数

- `update_interval`: 2000ms（每2秒检查）
- `card_threshold`: 25%（每25%进度发卡片）
- `estimated_minutes`: 预估任务时长

## 实现

**脚本**: `impl/bin/sse-stream-bridge.js`

**状态文件**: `state/sse-stream-state.json`

## 使用方法

### 启动stream

```bash
node impl/bin/sse-stream-bridge.js start task-001 "天气预报开发" 10
```

### 更新进度

```bash
node impl/bin/sse-stream-bridge.js update task-001 50 "执行阶段"
```

### 完成stream

```bash
node impl/bin/sse-stream-bridge.js complete task-001
```

### 检查活跃streams

```bash
node impl/bin/sse-stream-bridge.js active
```

## 借鉴要点

### DeerFlow SSE特点

1. **LangGraph SSE streaming**
   - 实时推送工具调用结果
   - 用户看到实时进度

2. **Middleware execution flow**
   - before_agent → before_model → after_model
   - 每个阶段实时通知

3. **Thread state management**
   - Checkpointing保存状态
   - 断点续传

## 与OpenClaw集成

### 心跳任务（新增）

```yaml
- name: sse-stream-check
  interval: 30s
  prompt: "Run impl/bin/sse-stream-bridge.js active. If active streams, check shouldSendUpdate for each. If shouldSend=true, generate Feishu update message."
```

### 与keepalive合并

SSE streaming + Keepalive机制协同工作：
- keepalive: 每30秒发保活消息
- sse-stream: 每25%进度发进度卡片

---

_创建时间: 2026-04-15_