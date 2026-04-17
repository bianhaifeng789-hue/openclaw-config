# 深度对比清单 - Harness Engineering vs OpenClaw

## 🔴 完全缺失的核心文件

### 1. agents.py → ❌ 无对应文件
**缺失内容**（515 行）:
- `TraceWriter` 类 - 记录每个 Agent 事件到 JSONL 文件
  - iteration(n, tokens)
  - llm_response(content, tool_calls, finish_reason)
  - tool_call(name, args, result)
  - middleware_inject(source, hook, message)
  - context_event(event_type, reason)
  - error(error_type, message)
  - finish(reason, iterations)
- `get_client()` - LLM 客户端单例（OpenAI）
- `llm_call_simple()` - 简单 LLM 调用（用于摘要），支持 rate limit retry
- `Agent` 类 - 核心 while 循环
  - `run(task)` 方法 - 执行 agent 循环
  - Middleware hooks: `per_iteration`, `pre_exit`, `post_tool`
  - Context lifecycle: `compact`, `reset` 检查
  - Rate limit handling: exponential backoff + retry
  - Empty choices handling
  - Text-only nudge: 防止模型描述而不执行
  - Tool execution with JSON parsing
  - Parallel tool calls 支持
  - Length truncation handling

**重要性**: 🔥🔥🔥 最高 - 这是 Harness 的核心 Agent 循环实现

---

### 2. context.py → ❌ 无对应文件
**缺失内容**（310 行）:
- Token counting
  - `count_tokens(messages)` - tiktoken 精确计数 + char-based 估算
  - `_get_encoder()` - tiktoken encoder 单例
- Context anxiety detection
  - `detect_anxiety(messages)` - 检测模型提前收尾的信号（9 个正则模式）
  - `_ANXIETY_PATTERNS` - anxiety pattern 列表
- Compaction
  - `compact_messages(messages, llm_call, role)` - 消息压缩
  - Role-specific retention: evaluator 50%, builder 20%, default 30%
  - `_safe_split_index()` - 确保 tool_call/tool pair 不被分割
  - `_messages_to_text()` - 消息文本化
- Reset (checkpoint)
  - `create_checkpoint(messages, llm_call)` - 创建结构化交接文档
  - `restore_from_checkpoint(checkpoint, system_prompt)` - 从 checkpoint 恢复
  - Git diff context 提取

**重要性**: 🔥🔥🔥 最高 - Context 生命周期管理是 Claude Code 架构的核心

---

### 3. middlewares.py → ❌ 只有 summarization-middleware.js（简化版）
**缺失内容**（500+ 行）:
- `AgentMiddleware` 基类 - 定义三个钩子接口
  - `post_tool(tool_name, tool_args, result, messages)`
  - `pre_exit(messages)`
  - `per_iteration(iteration, messages)`
- `LoopDetectionMiddleware`（150 行）
  - File edit counting（阈值=4）
  - Command repeat detection（阈值=3，fuzzy matching）
  - `_normalize_command()` - 命令标准化
  - Rapid-fire failed commands detection
- `PreExitVerificationMiddleware`（100 行）
  - 三级退出门
    - Gate 1: 未工作 → 强制开始工作（最多 3 次）
    - Gate 2: 有工作 → 强制验证 pass
    - Gate 3: 已验证 → 允许退出
  - `_has_done_work()` - 检查是否执行了工具
  - `_check_workspace_outputs()` - 自动检查 TODO/NotImplementedError
  - `_extract_task_requirements()` - 提取原始任务
- `TimeBudgetMiddleware`（80 行）
  - 时间预算警告（60%, 85%, 100%）
  - `sync_start_time(harness_start)` - 同步 harness 开始时间
  - 分钟级提醒
- `TaskTrackingMiddleware`（100 行）
  - 强制 `_todo.md` 创建（DEMAND_AFTER=4）
  - 定期更新提醒（UPDATE_INTERVAL=12）
  - `_todo_exists()`, `_read_todo()`, `_has_written_todo()`
- `SkeletonDetectionMiddleware`（80 行）
  - 检测骨架文件中的 TODO/NotImplementedError
  - `_scan_for_skeletons()` - 扫描工作区
  - 强制填充而非创建新文件
- `ErrorGuidanceMiddleware`（120 行）
  - 错误模式匹配（15 个 pattern）
    - command_not_found, file_not_found, permission_denied
    - pip_managed_env, python_import, compilation, linker
    - git, disk_full, oom
  - 每个模式提供具体恢复建议

**重要性**: 🔥🔥🔥 最高 - Middleware 是 ForgeCode 38% → 66% TB2 提升的关键

---

### 4. tools.py → ❌ 只有分散的工具文件（tools-registry.js, tool-auto-fix.js 等）
**缺失内容**（550 行）:
- 核心工具实现
  - `read_file(path)` - 60k char 截断 + 提示
  - `read_skill_file(path)` - 从 skills/ 读取
  - `write_file(path, content)` - 创建/覆写
  - `edit_file(path, old_string, new_string)` - 精确替换
  - `list_files(directory)` - 递归列表（200 条限制）
  - `run_bash(command, timeout)` - shell 执行
- 子代理
  - `delegate_task(task, role)` - 上下文隔离的子代理
- Playwright 浏览器测试
  - `browser_test(url, actions, screenshot, start_command, port)`
  - `_ensure_dev_server()` - 后台 dev server 管理
  - `stop_dev_server()` - 停止 dev server
  - Console errors 检测
  - Actions: click, fill, wait, evaluate, scroll
- Web 工具
  - `web_search(query, max_results)` - DuckDuckGo lite endpoint
  - `web_fetch(url)` - HTML → text
- Smart truncation
  - `_smart_truncate_output(stdout, stderr, limit=30k)` - 保留错误行
- OpenAI schemas
  - `TOOL_SCHEMAS` - 9 个工具 schema
  - `BROWSER_TOOL_SCHEMAS` - 2 个浏览器测试 schema
- Pre-validation
  - `_validate_and_fix(name, arguments)` - 自动修正常见错误
    - Empty path → warning
    - Absolute path → relative
    - Interactive commands → block
- Tool execution
  - `execute_tool(name, arguments)` - 统一执行入口
  - Claude Code patterns:
    - Empty results → marker
    - Large results (>50k) → persist to disk

**重要性**: 🔥🔥🔥 最高 - 这是 Harness 的工具系统核心

---

### 5. harness.py → ⚠️ harness.js（简化版，缺失核心循环）
**缺失内容**（原始 harness.py 约 200 行）:
- Harness 类
  - `run(prompt)` - 主循环实现
  - Profile loading
  - Phase management: Planning → Contract → Build → Evaluate
  - Score tracking + PASS/FAIL 判断
  - Max rounds 控制
- 实际的 Agent 实例化和调用
- Context lifecycle 集成
- Middleware wiring

**重要性**: 🔥🔥 高 - harness.js 只是框架骨架，缺少实际循环

---

## 🟡 部分缺失的功能

### 6. config.py → ⚠️ config-cli.js（缺少动态配置）
**缺失内容**:
- `_load_dotenv()` 的完整逻辑
- `WORKSPACE` 动态路径（当前硬编码）
- `PROGRESS_FILE` 配置
- 配置验证的完整性

**重要性**: 🔥 中

---

### 7. profiles/base.py → ⚠️ profile-config.js（刚创建，但未集成）
**缺失内容**:
- `format_build_task()` 的完整逻辑（趋势分析）
- `resolve_task_timeout()` 的子类实现
- `resolve_time_allocation()` 的子类实现
- 实际 Profile 子类（AppBuilderProfile, TerminalProfile 等）

**重要性**: 🔥 中

---

### 8. prompts.py → ⚠️ prompts-full.js（刚创建，但未集成）
**缺失内容**:
- 所有提示词都已移植，但未在 harness.js 中使用

**重要性**: 🔹 低（已移植）

---

## 🟢 已完整移植的文件

| 原始文件 | OpenClaw 文件 | 状态 |
|---------|--------------|------|
| `logger.py` | `logger-cli.js` | ✅ 完整移植（98% 相似） |
| `skills.py` | `skills-registry.js` | ✅ 完整移植（95% 相似） |
| `benchmarks/harbor_agent.py` | `harbor-adapter.js` | ✅ 完整移植（90% 相似） |
| `benchmarks/tb2_tasks.json` | `benchmarks/tb2_tasks.json` | ✅ 直接复制 |
| `skills/*` (36个) | `skills/tb2/*` (36个) | ✅ 直接复制 |
| `.env.template` | `.env.template` | ✅ 完整移植 |
| `requirements.txt` | 无（Node.js 不需要） | ⚠️ 可创建 package.json |

---

## 📊 功能覆盖率统计

| 功能模块 | 原始代码行数 | OpenClaw 行数 | 覆盖率 |
|---------|------------|--------------|--------|
| **核心循环** | | | |
| agents.py | 515 | 0 | ❌ 0% |
| context.py | 310 | 0 | ❌ 0% |
| middlewares.py | 500+ | 50 | ❌ 10% |
| tools.py | 550 | 0 | ❌ 0% |
| harness.py | 200 | 520 | ⚠️ 50%（骨架） |
| **配置/提示词** | | | |
| config.py | 100 | 150 | ✅ 80% |
| prompts.py | 200 | 400 | ✅ 100% |
| profiles/base.py | 150 | 200 | ✅ 90% |
| **支持功能** | | | |
| logger.py | 150 | 150 | ✅ 100% |
| skills.py | 80 | 120 | ✅ 100% |
| **总计** | **2555** | **1540** | **⚠️ 60%** |

---

## 🔥 必须移植的高优先级文件

### 优先级 1: agents.py → impl/bin/agent-loop.js
**原因**: 这是整个 Harness 的核心，没有它其他代码无法运行

**移植策略**:
- TraceWriter → Node.js fs.appendFileSync
- OpenAI client → openai npm package
- Agent.run() → async function + while loop
- Rate limit retry → exponential backoff
- Parallel tool calls → OpenAI API 支持

---

### 优先级 2: context.py → impl/bin/context-lifecycle.js
**原因**: Context 生命周期是 Claude Code 架构的核心创新

**移植策略**:
- tiktoken → char-based estimation（~4 chars/token）
- detect_anxiety → regex patterns
- compact_messages → message compression
- create_checkpoint → structured handoff document

---

### 优先级 3: middlewares.py → impl/bin/middlewares.js
**原因**: Middleware 是 TB2 成功率提升的关键

**移植策略**:
- LoopDetection → file edit counting + command repeat
- PreExitVerification → three-level exit gate
- TimeBudget → time warning injection
- TaskTracking → _todo.md enforcement
- SkeletonDetection → TODO marker detection
- ErrorGuidance → error pattern matching

---

### 优先级 4: tools.py → impl/bin/tools-executor.js
**原因**: 工具执行是 Agent 的基础能力

**移植策略**:
- read_file/write_file/edit_file → fs module
- run_bash → child_process.spawn
- delegate_task → sessions_spawn（OpenClaw 已有）
- browser_test → Playwright npm package
- web_search/web_fetch → DuckDuckGo lite endpoint
- smart_truncate → preserve error lines

---

## 总结

**当前状态**: OpenClaw 移植了 **约 60%** 的 Harness Engineering 功能
- ✅ 完整移植: logger, skills, prompts, profiles/base
- ⚠️ 部分移植: harness（骨架），config（简化）
- ❌ 完全缺失: agents.py, context.py, middlewares.py, tools.py

**关键差距**: 
1. **agents.py** - 核心 Agent 循环（515 行）
2. **context.py** - Context 生命周期（310 行）
3. **middlewares.py** - 6 个 Middleware（500+ 行）
4. **tools.py** - 工具执行系统（550 行）

**总计缺失**: **约 1275 行** 核心代码

---

创建时间：2026-04-17 19:00
状态：需要补充 4 个核心文件