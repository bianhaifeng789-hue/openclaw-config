# RUNBOOK - OpenClaw Session-safe Diagnostics

## 目标

把主 session 当作**控制台**，不是原始排障现场。

核心原则：

- 主线程只放结论、少量证据、下一步
- 大日志、大状态输出、大源码片段默认落文件
- 重诊断默认分流，不在 `agent:main:main` 里长链路滚动执行

## 为什么

最近的卡死根因不是 gateway daemon 经常宕机，而是：

1. 主 session 长期复用
2. `exec/read` 等工具产生的大输出被持续写进 session history
3. 排障过程中又不断读取日志、status、session 文件、源码
4. 造成 context overflow，体感上像“又挂了，只能重启”

所以真正要修的是 **session 使用方式**，不是单纯重启 gateway。

## 执行规则

### 1. 主 session 禁止的高风险动作

尽量不要在主线程里直接做这些事：

- `openclaw status` 的完整长输出反复打印
- 大量 `grep/tail` 网关日志并直接回显
- 读取很大的源码文件并整段贴回
- 读取 session json/jsonl 并回显大段内容
- 多轮连续排障，每轮都回显大量原始材料

### 2. 主 session 的正确输出格式

主线程里只保留：

- 结论
- 关键证据 5 到 20 行
- 完整材料文件路径
- 下一步建议

### 3. 默认分流策略

以下场景优先分流到独立 session / 子线程，或者先落文件再摘要：

- 排障
- 日志分析
- 代码库深挖
- 会话膨胀分析
- 配置比对
- 长时间执行链

## 推荐脚本

### `scripts/openclaw-diag-capture.sh`

作用：

- 采集 bounded `openclaw status`
- 采集 bounded `openclaw gateway status`
- 采集 bounded gateway log tail
- 过滤关键日志信号
- 把完整结果写入 `state/diagnostics/`
- 终端只输出摘要和文件路径

### 用法

```bash
npm run diag:openclaw
```

或者：

```bash
MAX_LOG_LINES=300 MAX_STATUS_LINES=150 ./scripts/openclaw-diag-capture.sh
```

## 实操模板

### 当用户说“OpenClaw 又挂了”

优先流程：

1. 运行 `npm run diag:openclaw`
2. 查看生成的 markdown 文件
3. 从文件中提炼少量关键证据
4. 在主线程只回复：
   - daemon 是否存活
   - 是否是 context overflow
   - 是否是 config conflict / channel issue
   - 后续是否需要独立排障线程

### 不要做

不要在主线程里直接连续跑：

- `openclaw status` 全量
- `tail -2000 /tmp/openclaw/...`
- `grep -n ...log | tail -200`
- `cat ~/.openclaw/agents/main/sessions/...jsonl`

这些都很容易再次污染当前 session。

## 后续增强建议

后续可以继续做：

1. session pressure precheck
2. large-output auto-file
3. 诊断任务自动分流到 isolated / sub-agent

## 轻量护栏（已落地）

### `scripts/session-pressure-guard.py`

作用：

- 读取 `~/.openclaw/agents/main/sessions/sessions.json`
- 检查当前主 session 的：
  - session file 大小
  - line count
  - compaction count
- 输出 `ok / warn / danger`
- 给出是否应该继续在主线程里做重诊断的建议

### 用法

```bash
npm run guard:session
```

或 JSON 输出：

```bash
npm run guard:session:json
```

### 建议接法

在准备做重日志 / 重排障前，先跑一遍：

1. `npm run guard:session`
2. 如果结果是 `warn` 或 `danger`
   - 不要继续在主 session 打大输出
   - 改用 `npm run diag:openclaw`
   - 或切 isolated / sub-agent 继续

当前这份 runbook 先解决最现实的问题：

> 不让主 session 一边诊断，一边把自己诊断死。
