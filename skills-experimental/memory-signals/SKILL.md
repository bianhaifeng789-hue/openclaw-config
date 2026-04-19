---
name: memory-signals
description: Detect user correction and reinforcement signals in conversation. Use when analyzing user messages for memory extraction - identify when users correct the agent's approach or confirm positive results. Implements DeerFlow's MemoryMiddleware signal detection patterns.
---

# Memory Signals Detection

识别用户对话中的纠正信号和肯定信号，用于记忆提取时增强上下文理解。

## 信号类型

### Correction（纠正信号）

用户明确指出 Agent 的错误或要求重新执行。

**英文模式**:
```
\bthat(?:'s| is) (?:wrong|incorrect)\b
\byou misunderstood\b
\btry again\b
\bredo\b
```

**中文模式**:
```
不对
你理解错了
你理解有误
重试
重新来
换一种
改用
```

### Reinforcement（肯定信号）

用户明确确认 Agent 的方法正确或满意。

**英文模式**:
```
\byes[,.]?\s+(?:exactly|perfect|that(?:'s| is) (?:right|correct|it))\b
\bperfect(?:[.!?]|$)\b
\bexactly\s+(?:right|correct)\b
\bthat(?:'s| is)\s+(?:exactly\s+)?(?:right|correct|what i (?:wanted|needed|meant))\b
\bkeep\s+(?:doing\s+)?that\b
\bjust\s+(?:like\s+)?(?:that|this)\b
\bthis is (?:great|helpful)\b(?:[.!?]|$)\b
```

**中文模式**:
```
对[，,]?\s*就是这样(?:[。！？!?.]|$)
完全正确(?:[。！？!?.]|$)
(?:对[，,]?\s*)?就是这个意思(?:[。！？!?.]|$)
正是我想要的(?:[。！？!?.]|$)
继续保持(?:[。！？!?.]|$)
```

## 检测逻辑

```javascript
function detectCorrection(messages) {
  // 只检查最近 6 条消息中的用户消息
  const recentUserMsgs = messages.slice(-6)
    .filter(msg => msg.type === 'human');
  
  for (const msg of recentUserMsgs) {
    const content = extractMessageText(msg).trim();
    if (!content) continue;
    
    // 匹配纠正模式
    for (const pattern of CORRECTION_PATTERNS) {
      if (pattern.test(content)) return true;
    }
  }
  
  return false;
}

function detectReinforcement(messages) {
  // 优先检查纠正，如果有纠正则不检测肯定
  if (detectCorrection(messages)) return false;
  
  const recentUserMsgs = messages.slice(-6)
    .filter(msg => msg.type === 'human');
  
  for (const msg of recentUserMsgs) {
    const content = extractMessageText(msg).trim();
    if (!content) continue;
    
    // 匹配肯定模式
    for (const pattern of REINFORCEMENT_PATTERNS) {
      if (pattern.test(content)) return true;
    }
  }
  
  return false;
}
```

## 记忆过滤

记忆提取时过滤消息，只保留：

- **Human 消息** - 用户输入（剥离 `<uploaded_files>` 区块）
- **AI 消息无 tool_calls** - 最终回复（非中间步骤）

过滤掉：
- Tool messages（工具调用结果）
- AI messages with tool_calls（中间步骤）
- `<uploaded_files>` 区块（会话级临时数据）

```javascript
function filterMessagesForMemory(messages) {
  const filtered = [];
  let skipNextAI = false;
  
  for (const msg of messages) {
    if (msg.type === 'human') {
      const contentStr = extractMessageText(msg);
      
      // 剥离上传文件区块
      if (contentStr.includes('<uploaded_files>')) {
        const stripped = contentStr.replace(/<uploaded_files>[\s\S]*?</uploaded_files>\n*/gi, '').trim();
        if (!stripped) {
          skipNextAI = true;
          continue;
        }
        filtered.push({ ...msg, content: stripped });
        skipNextAI = false;
      } else {
        filtered.push(msg);
        skipNextAI = false;
      }
    } else if (msg.type === 'ai') {
      if (!msg.tool_calls && !skipNextAI) {
        filtered.push(msg);
      }
      skipNextAI = false;
    }
  }
  
  return filtered;
}
```

## 应用场景

- **记忆提取** - 标记对话是否有用户纠正/肯定
- **会话分析** - 统计用户反馈类型
- **Agent 优化** - 识别常见错误模式

## 队列机制

使用防抖队列批量处理记忆更新：

```javascript
const memoryQueue = {
  pending: {},  // thread_id -> { messages, agentName, correction, reinforcement }
  
  add(threadId, messages, agentName, correction, reinforcement) {
    this.pending[threadId] = {
      messages,
      agentName,
      correction,
      reinforcement,
      addedAt: Date.now()
    };
  },
  
  // 定时批量处理（每 30s）
  flush() {
    for (const [threadId, context] of Object.entries(this.pending)) {
      if (Date.now() - context.addedAt > 30000) {
        this.process(threadId, context);
        delete this.pending[threadId];
      }
    }
  }
};
```

---

**来源**: DeerFlow `memory_middleware.py` (167 行)
**移植时间**: 2026-04-15