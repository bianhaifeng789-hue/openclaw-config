# Harness Engineering vs OpenClaw 架构差异分析

## 🔴 严重发现：核心架构缺失

对比 README.md 说明文档后，发现 OpenClaw 缺失 Harness 的**核心 Agent 循环**。

---

## README 概念 → 代码对照表

### 1. 三 Agent 架构

| README 描述 | Harness 代码位置 | OpenClaw 实现 | 状态 |
|-------------|-----------------|---------------|------|
| Planner | `harness.py` L55, `prompts.py` PLANNER_SYSTEM | `impl/bin/planner.js` | ⚠️ 单次执行，无循环 |
| Builder | `harness.py` L120-165, `prompts.py` BUILDER_SYSTEM | `impl/bin/builder.js` | ⚠️ 单次执行，无循环 |
| Evaluator | `harness.py` L168-183, `prompts.py` EVALUATOR_SYSTEM | `impl/bin/evaluator.js` | ⚠️ 单次执行，无循环 |
| Agent 间通信 | `spec.md`, `contract.md`, `feedback.md` | ✅ 有实现 | ✅ 完整 |

**差异**：Harness 的 Agent 是有循环的，OpenClaw 的 Agent 只是脚本。

---

### 2. 核心 Agent 循环（while loop）

**README 描述**：
```
文章的核心：llm.call(prompt) → 执行工具 → 裁剪上下文 → 重复
对应 agents.py 的 Agent.run() 方法（约 L78-170）
```

**Harness 实现（agents.py L178-240）**：
```python
class Agent:
    def run(self, task: str) -> str:
        for iteration in range(1, MAX_AGENT_ITERATIONS + 1):
            # 1. 上下文生命周期检查（压缩或重置）
            if token_count > RESET_THRESHOLD or detect_anxiety(messages):
                checkpoint = create_checkpoint(messages, llm_call)
                messages = restore_from_checkpoint(checkpoint, prompt)
            elif token_count > COMPRESS_THRESHOLD:
                messages = compact_messages(messages, llm_call, role)
            
            # 2. llm.call(messages)
            response = client.chat.completions.create(
                model=config.MODEL,
                messages=messages,
                tools=TOOL_SCHEMAS,
                parallel_tool_calls=True  # ← 关键
            )
            
            # 3. 执行 tool calls
            for tc in response.tool_calls:
                result = tools.execute_tool(tc.function.name, tc.function.arguments)
                messages.append({"role": "tool", "content": result})
            
            # 4. text_only_nudge 检测
            if not response.tool_calls and iteration <= 3:
                if detect_text_only_nudge(response.content, messages):
                    messages.append({"role": "user", "content": "[SYSTEM] STOP DESCRIBING..."})
                    continue
            
            # 5. 检查结束
            if not response.tool_calls:
                break
```

**OpenClaw 实现**：
- `impl/bin/builder.js` → ❌ **无循环，只是单次执行脚本**
- `impl/bin/evaluator.js` → ❌ **无循环，只是单次执行脚本**
- `impl/bin/planner.js` → ❌ **无循环，只是单次执行脚本**

**影响**：这是**致命缺失**，Harness 的核心是"让 Agent 自主循环执行工具"。

---

### 3. 上下文焦虑与重置

| README 描述 | Harness 代码位置 | OpenClaw 实现 | 状态 |
|-------------|-----------------|---------------|------|
| Compaction | `context.py` `compact_messages()` | `impl/bin/compact-cli.js` | ⚠️ 有功能，但 Agent 不内部调用 |
| Reset | `context.py` `create_checkpoint()` | ❌ 无对应 | ❌ 缺失 |
| 焦虑检测 | `context.py` `detect_anxiety()` | `impl/bin/anxiety-detector.js` | ⚠️ 有功能，但 Agent 不内部调用 |

**差异**：Harness 在 Agent 循环内部每轮检查 token_count 并自动调用 compact/reset，OpenClaw 是独立脚本需要手动调用。

---

### 4. 角色差异化的压缩策略

| README 描述 | Harness 实现 | OpenClaw 实现 | 状态 |
|-------------|-------------|---------------|------|
| Evaluator 保留 50% | `context.py` compact_messages(role="evaluator") | ❌ 无角色参数 | ❌ 缺失 |
| Builder 保留 20% | `context.py` compact_messages(role="builder") | ❌ 无角色参数 | ❌ 缺失 |

---

### 5. Sprint Contract 协商

| README 描述 | Harness 代码位置 | OpenClaw 实现 | 状态 |
|-------------|-----------------|---------------|------|
| Builder 提出 contract | `harness.py` `_negotiate_contract()` | `impl/bin/contract-negotiation.js` | ✅ 有实现 |
| Evaluator 审核 | `prompts.py` CONTRACT_REVIEWER_SYSTEM | ✅ 有实现 | ✅ 完整 |

---

### 6. REFINE vs PIVOT 策略决策

| README 描述 | Harness 实现 | OpenClaw 实现 | 状态 |
|-------------|-------------|---------------|------|
| 分数趋势分析 | `harness.py` delta = score_history[-1] - score_history[-2] | `impl/bin/builder.js` 有 strategy 参数 | ✅ 有实现 |
| Builder 决策 | Builder prompt 中包含分数历史 | ✅ 有实现 | ✅ 完整 |

---

### 7. Sub-Agent 上下文隔离

| README 描述 | Harness 实现 | OpenClaw 实现 | 状态 |
|-------------|-------------|---------------|------|
| delegate_task | `tools.py` `delegate_task()` | ❌ 无对应工具 | ❌ 缺失 |
| 只返回摘要 | `return result[:8000]` | ❌ 无实现 | ❌ 缺失 |

---

### 8. Skill 渐进式披露

| README 描述 | Harness 实现 | OpenClaw 实现 | 状态 |
|-------------|-------------|---------------|------|
| Level 1: name + description | `skills.py` `build_catalog_prompt()` | `skills/` 目录 | ✅ 有实现 |
| Level 2: Agent 读取 SKILL.md | Agent 自主调用 `read_skill_file()` | ❌ 无 read_skill_file 工具 | ❌ 缺失 |
| Level 3: 引用的子文件 | Agent 按需读取 | ❌ 无实现 | ❌ 缺失 |

**差异**：OpenClaw 有 skills/ 目录，但 Agent 无法自主读取 SKILL.md。

---

### 9. Evaluator 的 Playwright 浏览器测试

| README 描述 | Harness 实现 | OpenClaw 实现 | 状态 |
|-------------|-------------|---------------|------|
| browser_test | `tools.py` `browser_test()` | `impl/bin/browser-test.js` | ✅ 有实现 |
| 启动 dev server | ✅ | ✅ | ✅ 完整 |
| Headless Chromium | ✅ | ✅ (需要 Playwright) | ✅ 完整 |

---

### 10. 评估标准

| README 描述 | Harness 实现 | OpenClaw 实现 | 状态 |
|-------------|-------------|---------------|------|
| Design Quality | `prompts.py` EVALUATOR_SYSTEM | `impl/bin/evaluator.js` | ✅ 有实现 |
| Originality | ✅ | ✅ | ✅ 完整 |
| Craft | ✅ | ✅ | ✅ 完整 |
| Functionality | ✅ | ✅ | ✅ 完整 |

---

## 核心差异总结

| 功能 | Harness 实现 | OpenClaw 实现 | 差异程度 |
|------|-------------|---------------|---------|
| **Agent 循环** | `agents.py Agent.run()` | ❌ 无 | **致命缺失** |
| **上下文生命周期管理** | Agent 内部每轮检查 | compact-cli.js 独立脚本 | **架构差异** |
| **parallel_tool_calls** | Agent 内部支持 | tool-schemas.js 定义但未集成 | **未集成** |
| **text_only_nudge** | Agent 内部检测 | text-only-nudge.js 独立脚本 | **未集成** |
| **delegate_task** | `tools.py` 工具 | ❌ 无 | **缺失** |
| **read_skill_file** | `tools.py` 工具 | ❌ 无 | **缺失** |
| **compact_messages(role)** | 角色差异化压缩 | ❌ 无角色参数 | **缺失** |
| **create_checkpoint** | `context.py` Reset 功能 | ❌ 无 | **缺失** |

---

## 必须补齐的架构（按优先级）

### 1. Agent.run() while 循环（最高优先级）

**实现思路**：
```javascript
class Agent {
  constructor(name, systemPrompt, tools, middlewares) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.tools = tools;
    this.middlewares = middlewares;
    this.maxIterations = 60;
  }
  
  async run(task) {
    let messages = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: task }
    ];
    
    for (let iteration = 1; iteration <= this.maxIterations; iteration++) {
      // 1. 上下文生命周期检查
      const tokenCount = estimateTokens(messages);
      if (tokenCount > RESET_THRESHOLD || detectAnxiety(messages)) {
        const checkpoint = createCheckpoint(messages);
        messages = restoreFromCheckpoint(checkpoint, task);
      } else if (tokenCount > COMPRESS_THRESHOLD) {
        messages = compactMessages(messages, this.role);
      }
      
      // 2. Middleware: per_iteration
      for (const mw of this.middlewares) {
        const inject = mw.per_iteration(messages, iteration);
        if (inject) messages.push({ role: 'user', content: inject });
      }
      
      // 3. LLM call（parallel_tool_calls）
      const response = await llm.call({
        model: config.MODEL,
        messages,
        tools: this.tools,
        parallel_tool_calls: true
      });
      
      const msg = response.choices[0].message;
      
      // 4. text_only_nudge 检测
      if (!msg.tool_calls && iteration <= 3) {
        const nudge = detectTextOnlyNudge(iteration, msg.content, messages);
        if (nudge.needsNudge) {
          messages.push({ role: 'user', content: nudge.nudgeMessage });
          continue;
        }
      }
      
      // 5. 如果没有 tool_calls → pre_exit middlewares
      if (!msg.tool_calls) {
        for (const mw of this.middlewares) {
          const inject = mw.pre_exit(messages);
          if (inject) {
            messages.push({ role: 'user', content: inject });
            continue; // 强制继续
          }
        }
        break; // 真正结束
      }
      
      // 6. 执行 tool calls
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        const result = await executeTool(tc.function.name, tc.function.arguments);
        messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        
        // 7. Middleware: post_tool
        for (const mw of this.middlewares) {
          const inject = mw.post_tool(tc.function.name, tc.function.arguments, result, messages);
          if (inject && tc === msg.tool_calls[msg.tool_calls.length - 1]) {
            messages.push({ role: 'user', content: inject });
            break;
          }
        }
      }
      
      // 8. TraceWriter
      trace.tool_call(tc.function.name, tc.function.arguments, result);
    }
    
    return messages[messages.length - 1].content;
  }
}
```

### 2. Agent 内部上下文管理（高优先级）

**集成思路**：
- 在 Agent 循环内部每轮检查 token_count
- 自动调用 compact-cli.js 或 reset-cli.js
- 集成 anxiety-detector

### 3. Agent 内部 middleware 集成（中优先级）

**集成思路**：
- Agent 类接收 middlewares 参数
- 在循环的特定位置调用 middleware hooks

---

## 实际完成度修正

**之前报告的 100% 是错误的**，实际完成度：

- **核心架构**: 30% (Agent 循环缺失)
- **表层功能**: 80% (大部分脚本已实现)
- **真正可用**: 20% (无法自主循环执行)

---

## 结论

OpenClaw 目前只是**脚本集合**，缺少 Harness 的核心 Agent 循环架构。README 中提到的"核心 while loop"在 OpenClaw 中完全缺失。

**真正需要补齐的是**：
1. Agent.run() while 循环（agents.py 的核心）
2. Agent 内部上下文管理（context.py 的集成）
3. Agent 内部 middleware 集成（middlewares.py 的集成）
4. delegate_task + read_skill_file 工具（tools.py 的缺失工具）

而不是更多的独立脚本。

---

创建时间：2026-04-17 04:05 PDT
状态：已识别核心架构缺失（Agent 循环）