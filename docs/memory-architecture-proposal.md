# Memory Architecture Proposal

_Last updated: 2026-04-20_

## Goal

在不推翻现有 OpenClaw 记忆体系的前提下，引入更清晰的长期记忆分类，让 `MEMORY.md`、daily notes、heartbeat 继续各司其职。

目标是：
- 保留现有 `MEMORY.md` + `memory/YYYY-MM-DD.md` 主路径
- 只增加少量高价值目录
- 避免把记忆系统变成难维护的“第二套数据库”
- 兼容未来接入更强的外部 memory 系统（如 Mnemon）

## Current Baseline

当前已经存在的主结构：

- `MEMORY.md`：长期摘要 / 高价值结论
- `memory/YYYY-MM-DD.md`：每日原始记录
- `memory/heartbeat-state.json`：heartbeat 节流状态
- `HEARTBEAT.md`：轻量维护规则

这套结构已经能工作，问题主要不是“没有记忆”，而是“长期记忆分类还不够清晰”。

## Recommended Lightweight Structure

在现有 `memory/` 下新增以下目录：

```text
memory/
├── typed/
│   ├── user/
│   ├── feedback/
│   ├── project/
│   └── reference/
└── bank/
    └── procedures/
```

### typed/user/
存放稳定用户信息与偏好。

适合保存：
- 语言偏好
- 沟通风格偏好
- 长期工作方式
- 稳定背景信息

不适合保存：
- 临时要求
- 当天一次性偏好
- 未证实推断

### typed/feedback/
存放用户对助手工作方式的纠正与规范。

适合保存：
- 回复风格要求
- 代码/文档偏好
- 排查方式偏好
- 做事禁忌

### typed/project/
存放项目级长期上下文。

适合保存：
- 架构决策
- 技术选型原因
- 阶段性结论
- 长期目标 / 边界

### typed/reference/
存放外部系统或资源指针。

适合保存：
- 仓库地址
- 关键文档路径
- 外部服务位置
- 常用入口链接

### bank/procedures/
存放可复用的稳定流程。

适合保存：
- 排障 SOP
- 运维例行流程
- 环境检查步骤
- 需要重复执行的规范动作

## Source of Truth Rules

为了避免多处重复，建议遵守以下规则：

### MEMORY.md
用途：
- 面向“长期记住什么”
- 作为高层摘要与索引

不要放：
- 大量原始日志
- 高频变动细节
- 冗长流程正文

### memory/YYYY-MM-DD.md
用途：
- 当天发生了什么
- 讨论、尝试、结果、临时判断

不要强求结构化，重点是留痕。

### typed/*
用途：
- 从 daily notes 里提炼出的稳定知识
- 跨天仍有价值的信息

要求：
- 一条记忆一个主题
- 尽量短
- 带 Why / How to apply 最佳

### bank/procedures/*
用途：
- 会被重复执行的方法
- 比 daily notes 更稳定，比 runbook 更轻

## What Not to Store

以下内容默认不进入长期记忆：

- 大段代码
- git 历史（Git 是权威来源）
- 临时任务状态
- 未验证猜测
- 整段聊天记录
- 已在正式文档中维护且不需要重复索引的内容

## Minimal Operating Workflow

推荐工作流：

1. 日常对话 / 排查 /执行结果 → 先写 daily notes（必要时）
2. 如果发现“跨会话仍值得记住”的信息 → 提炼进 `typed/*`
3. 如果是稳定长期结论 → 更新 `MEMORY.md`
4. 如果是可复用流程 → 写入 `bank/procedures/`

## File Template

建议记忆文件格式：

```markdown
---
name: 用户偏好 - 回复风格
type: feedback
created: 2026-04-20
updated: 2026-04-20
---

用户偏好简洁直接，不喜欢空话。

Why:
- 多次要求直接给结论和动作

How to apply:
- 先行动后解释
- 默认给结论 + 下一步建议
```

## Notes on Mnemon

`mnemon-dev/mnemon` 更像一个“真正的持久化记忆引擎”：
- 二进制程序
- 独立存储
- recall / remember / link 协议
- 可接入 OpenClaw

而当前安装的 `claude-memory-pro` 更像“记忆规则与目录设计草案”。

结论：
- 现在先采用本提案做轻量结构化
- 未来如果要更强自动化，再考虑引入 Mnemon 作为底层记忆引擎
