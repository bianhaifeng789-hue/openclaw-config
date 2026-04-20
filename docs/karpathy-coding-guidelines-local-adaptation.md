# Karpathy Coding Guidelines - Local Adaptation

_Last updated: 2026-04-20_

目标：把 `skills/karpathy-coding-guidelines` 的四条行为准则，落到当前 OpenClaw workspace 的实际工作方式里。

## Why this local adaptation exists

原 skill 本身是通用 coding 行为规范，优点是短、清楚、约束明确。
但在当前 workspace 中，还需要结合以下本地事实来使用：

- 用户偏好：高信息密度、直接推进、少空话、先做再汇报
- 设计偏好：渐进式增强，避免不必要大重构
- 当前环境：OpenClaw workspace + memory + heartbeat + runbook + scripts 并存

所以这份本地适配的目的不是改写原 skill，而是把它和当前工作方式对齐。

## Local interpretation

### 1. Think Before Coding
在当前 workspace 里的含义：
- 先确认这是“真需求”还是“顺手想优化一片”
- 如果用户目标明确，就不要长篇分析，先给最小实现路径
- 如果存在分叉路径，只指出会影响实现的关键歧义
- 如果请求本身会引起系统级副作用（如改 gateway / hooks / plugins），先点明风险边界

### 2. Simplicity First
在当前 workspace 里的含义：
- 默认优先最小可行改动
- 不为了“体系更漂亮”就引入第二套系统
- 不为单次需求过早抽象
- 不把 heartbeat 做成总控，不把 memory 做成大一统 runtime，除非收益明确

### 3. Surgical Changes
在当前 workspace 里的含义：
- 只改和当前任务直接相关的文件
- 不顺手清理一堆旁支文件，除非它们阻塞当前任务
- 改动应尽量与现有 runbook / memory / docs / scripts 风格对齐
- 如果发现额外问题，优先记录，不默认扩展当前任务边界

### 4. Goal-Driven Execution
在当前 workspace 里的含义：
- 每次编码、配置、排障都尽量有明确验收动作
- 优先用真实可观察验证：
  - `openclaw status`
  - 脚本输出
  - 文档变更
  - 实际提示/行为变化
- 对多步改动，默认给出：
  - 做什么
  - 怎么验
  - 当前是否还残留风险

## Recommended working style in this repo

### When coding
默认顺序：
1. 先确定最小改动点
2. 直接改
3. 立即验证
4. 只报告关键结论与残留风险

### When changing config
默认顺序：
1. 先看当前配置实际生效位置
2. 先备份或确认回滚路径
3. 做最小配置修改
4. 重启/验证
5. 留档

### When introducing new tools/skills
默认顺序：
1. 先评估它是“文档型规范”还是“真正运行时能力”
2. 先低风险试装
3. 先降到保守档位
4. 先验证主链路
5. 先观察，再决定是否增强

## Practical reminder

如果后续做工程任务时要套这套 skill，最适合你的简化版口径是：

- 先想清楚，但别空转
- 先做最小改动，不要顺手重构
- 每一步都能验证
- 结论比铺垫重要

## Related files

- `skills/karpathy-coding-guidelines/SKILL.md`
- `USER.md`
- `MEMORY.md`
- `docs/memory-maintenance-rules.md`
- `docs/mnemon-openclaw-config.md`
