# Claude-Mem 项目研究与 OpenClaw 借鉴

调研时间：2026-04-21

调研目的：寻找 GitHub 上的 Claude memory 相关项目，提炼可借鉴到 OpenClaw 的设计与功能。

---

## 核心发现

### 1. Mnemon (mnemon-dev/mnemon) ⭐⭐⭐⭐⭐

**最关键发现**：这个项目明确声明 "Works with Claude Code, OpenClaw, and any CLI agent"，已经适配 OpenClaw！

**核心设计**：

1. **LLM-supervised pattern**
   - 不是嵌入自己的 LLM，而是让 host LLM 作为 supervisor
   - Binary 只处理确定性计算（storage, graph indexing, search, decay）
   - LLM 做判断（what to remember, how to link, when to forget）
   - 无额外 inference cost，无中间人

2. **Four-graph architecture**
   - Temporal graph（时序）
   - Entity graph（实体）
   - Causal graph（因果）
   - Semantic graph（语义）
   - 不只是向量相似度，而是多维度关联

3. **Intent-native protocol**
   - 三个原语：remember, link, recall
   - 命名直接映射 LLM 认知词汇
   - 输出是结构化 JSON，而非原始数据库行

4. **Hook-based integration**
   - Prime (SessionStart) - 加载执行手册
   - Remind (UserPromptSubmit) - 提醒 recall & remember
   - Nudge (Stop) - 提醒 remember
   - Compact (PreCompact) - 提取关键 insights

5. **Cross-framework memory sharing**
   - Claude Code, OpenClaw, NanoClaw, OpenCode, Gemini CLI
   - 共享 ~/.mnemon 数据库
   - 一个决策在一个 session 记住，所有 future session 可用

6. **Sub-agent delegation**
   - 主 agent（如 Opus）决定要记住什么
   - 委托给轻量 sub-agent（如 Sonnet）执行 mnemon remember
   - 节省 tokens，memory 操作不进主 context

**OpenClaw 集成命令**：
```bash
mnemon setup --target openclaw --yes
```

**可借鉴点**：
- LLM-supervised pattern 与 OpenClaw 的 agent 设计理念一致
- Four-graph architecture 可以增强 MEMORY.md 的结构化能力
- Intent-native protocol 可以作为 OpenClaw memory 工具的设计参考
- Sub-agent delegation 可以节省主 session tokens
- 已经适配 OpenClaw，可以直接集成或参考实现

---

### 2. Claude Memory Engine (HelloRuru/claude-memory-engine) ⭐⭐⭐⭐

**核心设计**：

1. **Student Loop - 8-step learning cycle**
   - In class（自动）: 每 20 messages checkpoint, pre-compact snapshot, session-end summary
   - Final exam review（手动）: /reflect 周期性反思，pattern 分析，清理

2. **Error Notebook - 错误笔记本**
   - /analyze 记录错误和修复
   - /correct 在每个 task 前自动提醒过往错误
   - 同类错误 3+ 次 → 升级为 hard rule

3. **Smart Context - 智能上下文**
   - 根据工作目录自动加载正确的项目记忆
   - 切换项目自动切换记忆文件
   - 无需配置，零依赖

4. **Session Handoff - 会话交接**
   - /handoff 生成交接文件
   - 新 session 自动 pickup
   - 多窗口协作不丢失 context

5. **Cross-device sync - 跨设备同步**
   - GitHub repo 作为备份
   - /backup, /sync, /recover
   - 新设备恢复所有记忆

6. **8 Hooks**
   - session-start, session-end, pre-compact
   - memory-sync (every message), write-guard, pre-push-check
   - mid-session-checkpoint (every 20 messages)

**可借鉴点**：
- Student Loop 概念可以改进 HEARTBEAT.md 的设计
- Error Notebook 可以作为 memory-maintenance 的新能力
- Smart Context 可以增强 project-scoped memory
- Session Handoff 对多 session 协作非常有价值
- Cross-device sync 可以解决 workspace 迁移问题

---

### 3. Total Agent Memory (vbcherepanov/total-agent-memory) ⭐⭐⭐⭐

**核心设计**：

1. **Procedural Memory - 流程记忆**
   - workflow_predict - 预测解决类似任务的步骤
   - workflow_track - 记录工作流执行
   - classify_task - 自动 L1-L4 复杂度分类
   - phase_transition - van/plan/creative/build/reflect/archive 状态机

2. **Cross-project Analogy - 跨项目类比**
   - analogize - 在其他 repo 找类似方案
   - Jaccard + Dempster-Shafer 融合
   - ingest_codebase - AST codebase ingest（9 种语言）

3. **Pre-edit Risk Warnings - 编辑前风险警告**
   - file_context - 文件风险评分
   - 显示过往错误和 hot spots
   - 避免重复踩坑

4. **Self-improving Rules - 自改进规则**
   - learn_error - Bash 失败 → pattern → 规则
   - N≥3 自动整合为 behavioral rules
   - self_rules_context - phase-scoped 规则（~70% token reduction）

5. **Temporal Facts - 时间事实**
   - kg_add_fact with valid_from/valid_to
   - kg_at - 查询某时刻有效的事实
   - Append-only KG

6. **6-stage Hybrid Retrieval**
   - BM25 + dense + fuzzy + graph + CrossEncoder + MMR
   - RRF fusion
   - 96.2% R@5 on LongMemEval

7. **60+ MCP Tools**
   - Core memory (15)
   - Knowledge graph (6)
   - Episodic memory (4)
   - Reflection (7)
   - Temporal KG (4)
   - Procedural (3)
   - Pre-flight guards (8)

**可借鉴点**：
- Procedural memory 可以帮助 agent 记住"怎么做"，不只是"是什么"
- Cross-project analogy 可以复用过往项目经验
- Pre-edit risk warnings 可以减少踩坑
- Self-improving rules 可以自动演进 AGENTS.md
- Temporal facts 可以支持"当时是什么状态"的查询
- 6-stage retrieval 可以增强 memory-maintenance 的检索能力

---

## 可借鉴功能分类

### P0 - 高优先级（可以直接集成或快速借鉴）

| 功能 | 来源 | OpenClaw 对应 | 借鉴方式 |
|---|---|---|---|
| LLM-supervised pattern | Mnemon | Agent 设计理念 | 参考 mnemon setup --target openclaw |
| Intent-native protocol | Mnemon | Memory 工具设计 | remember/link/recall 三个原语 |
| Student Loop | Claude Memory Engine | HEARTBEAT.md | 增加 8-step learning cycle |
| Smart Context | Claude Memory Engine | Project memory | 按 working directory 自动加载 |
| Error Notebook | Claude Memory Engine | memory-maintenance | 记录错误和修复，不重复踩坑 |
| Session Handoff | Claude Memory Engine | 多 session 协作 | /handoff 生成交接文件 |

### P1 - 中优先级（需要一定改造）

| 功能 | 来源 | OpenClaw 对应 | 借鉴方式 |
|---|---|---|---|
| Four-graph architecture | Mnemon | MEMORY.md 结构 | temporal/entity/causal/semantic |
| Sub-agent delegation | Mnemon | sessions_spawn | 记忆操作委托给 sub-agent |
| Procedural memory | Total Agent Memory | workflows/ | 记住"怎么做"，不只是"是什么" |
| Cross-project analogy | Total Agent Memory | skills/ | 在其他项目找类似方案 |
| Self-improving rules | Total Agent Memory | AGENTS.md | 自动演进 behavioral rules |
| Temporal facts | Total Agent Memory | MEMORY.md | 支持"当时是什么状态"的查询 |

### P2 - 低优先级（长期规划）

| 功能 | 来源 | OpenClaw 对应 | 借鉴方式 |
|---|---|
| Cross-device sync | Claude Memory Engine | Workspace backup | GitHub repo 同步 |
| Pre-edit risk warnings | Total Agent Memory | file_context | 编辑前风险评分 |
| 6-stage retrieval | Total Agent Memory | memory-maintenance | BM25+dense+graph+rerank |
| 3D WebGL visualization | Total Agent Memory | Dashboard | 可视化 knowledge graph |

---

## 具体借鉴建议

### 1. 增强 MEMORY.md 结构

当前 MEMORY.md 是平铺结构，可以借鉴 Mnemon 的 four-graph：

```markdown
## Temporal Memory (时间记忆)
- 2026-04-17: Harness Engineering Phase 3 完成
- 2026-04-20: PRD 固定模板创建

## Entity Memory (实体记忆)
- OpenClaw Workspace-Dispatcher: ~/.openclaw/workspace-dispatcher
- Node.js: v25.8.1
- Feishu integration: 通知推送

## Causal Memory (因果记忆)
- 发现覆盖率仅 60% → 补齐 4 个核心文件 → 覆盖率达 100%
- 需要 PRD 模板 → 创建固定模板 → 飞书文档 + 工作流

## Semantic Memory (语义记忆)
- Harness Engineering: 移植 Python 到 Node.js
- PRD Template: 可评审、可设计、可开发、可测试的文档模板
```

### 2. 增加 Intent-native Protocol

当前 memory 工具是隐式的，可以借鉴 Mnemon 的三个原语：

```markdown
## Memory Protocol

### remember
- 目的：记住新信息
- 触发：决策、错误修复、关键发现
- 输出：写入 MEMORY.md 或 daily notes

### link
- 目的：建立关联
- 触发：发现因果、实体关联、语义相似
- 输出：在 MEMORY.md 中建立链接

### recall
- 目的：检索过往信息
- 触发：遇到类似问题、需要过往决策
- 输出：从 MEMORY.md 或 daily notes 读取
```

### 3. 增强 HEARTBEAT.md - Student Loop

当前 HEARTBEAT 是简单轮询，可以借鉴 Student Loop：

```markdown
## Student Loop (8-step)

### In Class（自动）
1. Every 20 messages - checkpoint + mini analysis
2. Pre-compact - snapshot + pitfall detection
3. Session-end - summary + backup（best-effort）

### Final Exam Review（手动）
4. /reflect - 回顾过去 7 天，标记有用/过时
5. Condense - 四问决策：保留？压缩？已有规则？删除？
6. Re-study - 从清理后的数据重新发现 pattern
7. Slim down - 列出可移除项，等待确认
8. Wrap up - 产出报告：学到什么、改变了什么、下次注意什么
```

### 4. 增加 Error Notebook

在 memory/ 下增加 error-notebook.md：

```markdown
# Error Notebook

记录错误和修复，避免重复踩坑。

## 错误记录格式

| 时间 | 错误类型 | 错误描述 | 修复方案 | 出现次数 | 升级为规则 |
|---|---|---|---|---|---|
| 2026-04-17 | 配置错误 | Git config 冲突 | 重置 config | 1 | 否 |
| 2026-04-20 | 流程错误 | 飞书文档写入失败 | 分批写入 | 2 | 待观察 |

## 规则升级

同类错误 3+ 次 → 升级为 hard rule → 写入 AGENTS.md
```

### 5. 增加 Session Handoff

在 workspace 下增加 handoff/ 目录：

```markdown
# Session Handoff

支持多窗口协作，不丢失 context。

## /handoff 流程

1. 生成 handoff 文件：当前进度、决策、未完成任务
2. 新 session 自动 pickup
3. 实时检测新 handoff 文件
4. 读取一次后移动到 archive/
```

---

## 集成 Mnemon 的具体步骤

Mnemon 已经支持 OpenClaw，可以直接集成：

```bash
# 安装 Mnemon
brew install mnemon-dev/tap/mnemon

# 部署到 OpenClaw
mnemon setup --target openclaw --yes

# 重启 OpenClaw Gateway
openclaw gateway restart
```

集成后：
- ~/.mnemon 作为共享 memory 数据库
- 四个 hook 自动注入：Prime, Remind, Nudge, Compact
- 所有 OpenClaw session 共享同一 memory pool
- remember/link/recall 三原语可用

---

## 总结

**关键发现**：
- Mnemon 已经适配 OpenClaw，可以直接集成
- Claude Memory Engine 的 Student Loop 和 Error Notebook 可以改进 HEARTBEAT 和 memory-maintenance
- Total Agent Memory 的 Procedural memory 和 Self-improving rules 可以增强 agent 演进能力

**短期建议（本周）**：
1. 评估是否集成 Mnemon（已有 OpenClaw 支持）
2. 增强 MEMORY.md 为 four-graph 结构
3. 增加 Error Notebook 到 memory/

**中期建议（本月）**：
4. 改进 HEARTBEAT 为 Student Loop
5. 增加 Session Handoff 功能
6. 增加 Intent-native protocol

**长期建议（季度）**：
7. Procedural memory - 记住"怎么做"
8. Cross-project analogy - 复用过往经验
9. Cross-device sync - GitHub 同步

---

_调研人：Claw_  
_调研时间：2026-04-21 00:39 Asia/Shanghai_