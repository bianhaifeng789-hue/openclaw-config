---
name: loop-detection
description: Detect and prevent repetitive tool call loops. Use when the agent is calling the same tool with the same arguments repeatedly, wasting tokens and time. Implements DeerFlow's LoopDetectionMiddleware pattern with configurable thresholds.
---

# Loop Detection

防止 Agent 无限循环调用相同工具，浪费 token 和时间。

## 检测策略

借鉴 DeerFlow 的 LoopDetectionMiddleware：

1. **Hash 工具调用** - 对每次 tool call (name + args) 生成稳定 hash
2. **滑动窗口追踪** - 维护最近 N 次调用的 hash 历史
3. **阈值警告** - 相同 hash 出现 >= 3 次，注入警告消息
4. **强制停止** - 相同 hash 出现 >= 5 次，剥离 tool_calls，强制输出文本

## 默认配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| warn_threshold | 3 | 注入警告阈值 |
| hard_limit | 5 | 强制停止阈值 |
| window_size | 20 | 滑动窗口大小 |
| max_tracked_threads | 100 | LRU 线程追踪上限 |

## 实现要点

### Stable Tool Key

```javascript
// 对工具调用生成稳定 key，避免噪音干扰
function stableToolKey(name, args) {
  // read_file: 分桶处理行号范围（bucket_size=200）
  if (name === 'read_file') {
    const bucketStart = Math.floor((startLine - 1) / 200);
    const bucketEnd = Math.floor((endLine - 1) / 200);
    return `${path}:${bucketStart}-${bucketEnd}`;
  }
  
  // write_file/str_replace: hash 全量 args（内容敏感）
  if (name === 'write_file' || name === 'str_replace') {
    return JSON.stringify(args, Object.keys(args).sort());
  }
  
  // 其他工具：提取关键字段 (path, url, query, command)
  const salientFields = ['path', 'url', 'query', 'command', 'pattern', 'glob'];
  const stableArgs = {};
  for (const field of salientFields) {
    if (args[field] !== undefined) stableArgs[field] = args[field];
  }
  return JSON.stringify(stableArgs);
}
```

### Hash 工具调用集

```javascript
// 多个 tool call 时，生成多集合 hash（顺序无关）
function hashToolCalls(toolCalls) {
  const normalized = toolCalls.map(tc => 
    `${tc.name}:${stableToolKey(tc.name, tc.args)}`
  ).sort();
  return md5(JSON.stringify(normalized)).slice(0, 12);
}
```

### 检测流程

```javascript
function trackAndCheck(state, threadId) {
  const lastMsg = state.messages[state.messages.length - 1];
  if (lastMsg.type !== 'ai' || !lastMsg.tool_calls) return null;
  
  const callHash = hashToolCalls(lastMsg.tool_calls);
  
  // 更新历史
  history[threadId].push(callHash);
  if (history[threadId].length > windowSize) {
    history[threadId] = history[threadId].slice(-windowSize);
  }
  
  const count = history[threadId].filter(h => h === callHash).length;
  
  // 强制停止
  if (count >= hardLimit) {
    return {
      hardStop: true,
      message: '[FORCED STOP] Repeated tool calls exceeded safety limit.'
    };
  }
  
  // 注入警告
  if (count >= warnThreshold && !warned[threadId].has(callHash)) {
    warned[threadId].add(callHash);
    return {
      warning: '[LOOP DETECTED] You are repeating tool calls. Stop and produce final answer.'
    };
  }
  
  return null;
}
```

## 应用场景

- **文件读取循环** - Agent 反复读取同一文件的不同行范围
- **搜索重复** - 反复执行相同搜索查询
- **命令重复** - 反复执行相同 shell 命令

## 警告消息

```
[LOOP DETECTED] You are repeating the same tool calls. Stop calling tools and produce your final answer now. If you cannot complete the task, summarize what you accomplished so far.
```

## 强制停止消息

```
[FORCED STOP] Repeated tool calls exceeded the safety limit. Producing final answer with results collected so far.
```

---

**来源**: DeerFlow `loop_detection_middleware.py` (332 行)
**移植时间**: 2026-04-15