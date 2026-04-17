# Harness Engineering vs OpenClaw 深度对比报告

## 真实对比结果（2026-04-17 04:00）

### ❌ 缺失的核心功能

#### 1. parallel_tool_calls ⚠️⚠️⚠️ **最关键缺失**
- **来源**: agents.py 第 127 行
- **功能**: 允许模型在一次响应中发出多个独立的工具调用
- **影响**: Claude Code 架构的核心优化，显著提升吞吐量
- **Harness 实现**: `kwargs["parallel_tool_calls"] = True`
- **OpenClaw 状态**: ❌ 完全缺失

#### 2. text_only_nudge ⚠️⚠️⚠️ **最关键缺失**
- **来源**: agents.py 第 299-311 行
- **功能**: 检测模型"描述行动而不是执行"，注入强制提示
- **影响**: 防止弱模型只写计划不执行
- **Harness 实现**: 
```python
if msg.content and iteration <= 3:
    content_lower = msg.content.lower()
    action_words = ["i will", "i'll", "let me", "first,", "step 1", ...]
    is_planning_text = any(w in content_lower for w in action_words)
    if is_planning_text and has_no_prior_tools:
        messages.append({"role": "user", "content": "[SYSTEM] STOP DESCRIBING. START EXECUTING..."})
```
- **OpenClaw 状态**: ❌ 完全缺失

#### 3. TOOL_SCHEMAS (工具定义) ⚠️⚠️
- **来源**: tools.py 第 649-882 行
- **功能**: OpenAI function-calling schemas（11个工具）
- **影响**: Agent 可用的工具集定义
- **Harness 实现**: 
```python
TOOL_SCHEMAS = [
  read_file, read_skill_file, write_file, list_files, run_bash,
  delegate_task, web_search, web_fetch
]
BROWSER_TOOL_SCHEMAS = [browser_test, stop_dev_server]
```
- **OpenClaw 状态**: ⚠️ 有 tools-registry.js，但架构不同

#### 4. .github/workflows (TB2 CI/CD) ⚠️
- **来源**: .github/workflows/tb2.yml
- **功能**: Terminal-Bench 2.0 批量测试自动化
- **影响**: 无法自动化 benchmark 运行
- **OpenClaw 状态**: ❌ 缺失 .github/workflows 目录

---

### ✅ 已实现的功能

| 功能 | Harness 模块 | OpenClaw 实现 | 状态 |
|------|-------------|---------------|------|
| TraceWriter | agents.py | trace-writer.js | ✅ 完整 |
|焦虑检测 | middlewares.py | anxiety-detector.js | ✅ 完整 |
| 三级门控 | middlewares.py | pre-exit-gate.js | ✅ 增强 |
| Loop Detection | middlewares.py | loop-detector-enhanced.js | ✅ 完整 |
| Time Budget | middlewares.py | time-budget.js | ✅ 完整 |
| Task Tracking | middlewares.py | task-tracking.js | ✅ 完整 |
| Skeleton Detection | middlewares.py | skeleton-detector.js | ✅ 完整 |
| Error Guidance | middlewares.py | error-guidance.js | ✅ 完整 |
| Smart Truncate | tools.py | smart-truncate.js | ✅ 完整 |
| Browser Test | tools.py | browser-test.js | ✅ 完整 |
| Skill Registry | skills.py | skill-progressive-disclosure.js | ✅ 完整 |
| Profiles | profiles/*.py | profiles/*.js (5个) | ✅ 完整 |
| Benchmarks | benchmarks/*.json | benchmarks/tb2_tasks.json | ✅ 完整 |
| Progress Persistence | context.py | progress-persistence.js | ✅ 刚补齐 |
| Contract Negotiation | harness.py | contract-negotiation.js | ✅ 完整 |
| Environment Bootstrap | terminal.py | harness.js | ✅ 完整 |

---

### ⚠️ 架构差异（不是缺失）

| 功能 | Harness 实现 | OpenClaw 实现 | 说明 |
|------|-------------|---------------|------|
| Tools 定义 | TOOL_SCHEMAS 数组 | tools-registry.js | 架构不同，功能相似 |
| Logger | logger.py | console.log | 不同实现 |
| Prompts | prompts.py 字符串 | planner.js/builder.js 嵌入 | 不同位置 |

---

### 📊 文件对比统计

| 文件 | Harness 行数 | OpenClaw 对应实现 | 状态 |
|------|-------------|-------------------|------|
| agents.py | 416 | trace-writer.js + harness.js | ⚠️ 缺 parallel_tool_calls/text_only_nudge |
| middlewares.py | 749 | *detector.js + *middleware.js (1773行) | ✅ 功能完整 |
| tools.py | 880 | tools-registry.js + smart-truncate.js | ⚠️ 架构不同 |
| harness.py | 389 | harness.js | ✅ 功能完整 |
| context.py | 309 | compact-cli.js + progress-persistence.js | ✅ 刚补齐 |
| prompts.py | 183 | planner.js/builder.js/evaluator.js | ✅ 功能完整 |
| logger.py | 148 | 无对应 | ⚠️ 不同实现 |
| skills.py | 96 | skill-progressive-disclosure.js | ✅ 功能完整 |
| config.py | 58 | harness.js 内嵌 | ✅ 功能完整 |

---

### 🔴 必须补齐的模块（按优先级）

#### 1. parallel_tool_calls（最高优先级）
- **影响**: Claude Code 架构的核心优化
- **实现难度**: 中等（需要修改 Agent 调用逻辑）
- **预计时间**: 30 分钟

#### 2. text_only_nudge（高优先级）
- **影响**: 防止弱模型只描述不执行
- **实现难度**: 低（检测文本模式）
- **预计时间**: 15 分钟

#### 3. TOOL_SCHEMAS（中优先级）
- **影响**: Agent 可用的工具集定义
- **实现难度**: 低（复制 TOOL_SCHEMAS 定义）
- **预计时间**: 20 分钟

#### 4. .github/workflows（低优先级）
- **影响**: TB2 benchmark 自动化
- **实现难度**: 低（复制 workflows）
- **预计时间**: 10 分钟

---

### 📈 总体完成度

- **核心功能**: 16/18 (89%)
- **中间件**: 7/7 (100%)
- **Profiles**: 5/5 (100%)
- **Benchmarks**: 1/1 (100%)
- **缺失关键**: parallel_tool_calls + text_only_nudge

---

创建时间：2026-04-17 04:00 PDT
状态：已识别2个最关键缺失（parallel_tool_calls/text_only_nudge）
