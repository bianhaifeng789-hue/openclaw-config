---
name: prompt-suggestion
description: "Proactively suggest next steps after task completion or important decisions. Use when: task completed or decision made."
metadata:
  openclaw:
    emoji: "🎯"
    triggers: [task-completion, decision-point]
    maxSuggestionsPerDay: 5
---

# Prompt Suggestion Skill - 提示建议

主动建议下一步操作，提升用户体验。

## 触发时机

- **会话结束检测**：用户一段时间没回复（如 5 分钟）
- **任务完成检测**：刚完成一个明显任务
- **决策点检测**：用户做了重要选择

**注意**：飞书是即时通讯，不适合真正的"会话结束"检测。
改为：
- 任务完成时主动建议
- 周期性检查（heartbeat）时建议

## 建议类型

### 1. 记录建议

刚完成重要任务或决策时：

```
"需要我帮你把这次决策记录到 MEMORY.md 吗？"
```

### 2. 继续建议

有明确下一步时：

```
"接下来我可以帮你：
- 实现下一个功能
- 写一份总结文档
- 继续优化刚才的方案"
```

### 3. 检查建议

长时间没交互后：

```
"我刚才帮你分析了 OpenClaw 架构，
有什么想继续深入的吗？"
```

### 4. 习惯建议

基于用户习惯：

```
"快到睡觉时间了（根据你的活跃时间），
需要我整理今天的会话总结吗？"
```

## 实现策略

参考 Claude Code `services/PromptSuggestion/speculation.ts`：

**Speculation（推测）逻辑**：
- 分析当前对话状态
- 推测可能的下一步
- 提供具体建议而非泛泛"还有什么吗"

**飞书适配**：
- 不频繁打扰（避免像机器人）
- 建议要有价值（不是废话）
- 尊重用户时间（深夜不发）

## 状态追踪

```json
// memory/heartbeat-state.json
{
  "lastPromptSuggestion": <timestamp>,
  "pendingSuggestions": [
    "等待记录决策到 MEMORY.md",
    "等待继续下一个功能"
  ]
}
```

## 执行规则

1. **检查距离上次建议时间** > 30 分钟（避免频繁）
2. **检查是否有 pending 任务**（上次建议未响应）
3. **生成新建议**（基于当前状态）
4. **发送建议**（飞书回复）
5. **记录状态**（更新 heartbeat-state.json）

## 配置

```yaml
promptSuggestion:
  enabled: true
  minIntervalMinutes: 30
  maxSuggestionsPerDay: 5
  quietHours:  # 不发送建议的时间段
    start: 23:00
    end: 08:00
  suggestionTypes:
    - recordDecision    # 记录决策
    - nextStep          # 下一步
    - summarize         # 总结
    - checkIn           # 检查进度
```

---

## 示例场景

### 场景 1：刚完成记忆系统设计

```
用户：按顺序实现
助手：已创建 MEMORY.md 结构、memory-maintenance skill...
（5 分钟后，用户没回复）

建议："记忆系统基础框架已完成。
需要我继续实现 Insights 洞察分析功能吗？"
```

### 场景 2：做了重要决策

```
用户：你帮我做主，我只要实现智能化
助手：好，我直接实现...

建议："我注意到你偏好自主决策。
我会把这个偏好记录到 MEMORY.md，以后都这样工作。"
```

### 场景 3：深夜检查

```
（22:49，接近安静时间）

不发送建议（尊重 quietHours）
等到下次白天活跃时间再检查
```

---

## 注意事项

- **不要过度建议**：每次都有建议会让用户烦躁
- **建议要有价值**：不是"还有什么吗"这种废话
- **尊重用户时间**：深夜不发，忙碌时段不发
- **可关闭**：用户可以配置禁用此功能