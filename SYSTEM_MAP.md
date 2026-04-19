# SYSTEM_MAP.md - OpenClaw 本地系统导航

目标：为当前这套记忆、上下文压缩、排障、自动化约束文件提供一个最短入口，避免文件逐渐增多后又失去整体性。

## 先看什么

### 1. 当前异常 / 排障
先看：
- `RUNBOOK.md` → 排障顺序与最小检查路径
- `memory/YYYY-MM-DD.md` → 今天已经发生过什么
- `MEMORY.md` → 这类问题是否有长期规律

### 2. 上下文太重 / 会话膨胀
先看：
- `CONTEXT.md` → 上下文压缩与收口规则
- `SESSION_ARCHITECTURE.md` → session 分层、分流、收口与恢复规则
- `MEMORY_FLOW.md` → 结论该流到哪里
- `CLOSEOUT.md` → 当前线程何时收口、最少做什么

### 3. 本地脚本 / 自动化 / cron / 守护问题
先看：
- `SCRIPTS.md` → 本地自动化现状、禁忌、替代方案
- `RUNBOOK.md` → 排障顺序

### 4. 后续还要优化什么
先看：
- `OPENCLAW_TODO.md` → 后续优化清单

### 5. 产品经理工作流
先看：
- `INSIGHTS.md` → 用户声音、竞品变化、市场观察与产品洞察
- `DECISIONS.md` → 产品决策、备选方案、选择理由与风险
- `EXPERIMENTS.md` → 增长/产品实验、结果与结论

## 文件分工

- `memory/YYYY-MM-DD.md`：当天事件、摘要、incident 记录
- `MEMORY.md`：长期规律、长期应记住的结论
- `RUNBOOK.md`：下次遇到问题时怎么查
- `SCRIPTS.md`：本地自动化脚本状态与禁忌
- `CONTEXT.md`：上下文压缩与线程收口规则
- `SESSION_ARCHITECTURE.md`：session 分层、任务分流、恢复与执行规则
- `MEMORY_FLOW.md`：daily / memory / runbook / scripts / PM files 之间的流转规则
- `CLOSEOUT.md`：线程收口协议与最少收尾动作
- `OPENCLAW_TODO.md`：未来待处理优化项
- `INCIDENT_TEMPLATE.md`：重大事件模板
- `HEARTBEAT.md`：心跳任务边界与规则
- `INSIGHTS.md`：产品洞察库
- `DECISIONS.md`：产品决策记录
- `EXPERIMENTS.md`：增长与产品实验记录

## 默认工作模式

1. 先观察，不急着自动修复
2. 长日志先外化，不把原始大输出长期留在主会话里
3. 一轮诊断 + 修复 + 验证完成后优先收口
4. 把结论写进正确的文件，而不是依赖聊天历史长期保存
5. 不恢复破坏性 shell 自动化（watchdog / keeper / live session 裁剪）

## 一句话索引

- 想知道“发生了什么” → `memory/YYYY-MM-DD.md`
- 想知道“长期该记住什么” → `MEMORY.md`
- 想知道“下次怎么查” → `RUNBOOK.md`
- 想知道“哪些脚本不能恢复” → `SCRIPTS.md`
- 想知道“如何避免上下文爆炸” → `CONTEXT.md`
- 想知道“session 应如何分层与分流” → `SESSION_ARCHITECTURE.md`
- 想知道“信息该写去哪里” → `MEMORY_FLOW.md`
- 想知道“什么时候该收口” → `CLOSEOUT.md`
- 想知道“后面还要做什么” → `OPENCLAW_TODO.md`
- 想知道“用户/市场洞察写哪里” → `INSIGHTS.md`
- 想知道“产品决策记哪里” → `DECISIONS.md`
- 想知道“实验结果留哪里” → `EXPERIMENTS.md`
