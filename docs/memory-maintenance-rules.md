# Memory Maintenance Rules

_Last updated: 2026-04-20_

目标：让记忆维护保持轻量、稳定、可持续，不把 daily notes、MEMORY.md、typed memory 混成一团。

## 1. 记到哪里

### daily notes → `memory/YYYY-MM-DD.md`
适合记录：
- 当天发生了什么
- 做过哪些尝试
- 临时判断
- 排查过程
- 尚未稳定的想法

原则：
- 先留痕，不强求完美结构
- 当天记录优先写这里

### MEMORY.md
适合记录：
- 长期稳定背景
- 已经确认的重要决策
- 用户稳定偏好
- 关键结论索引

原则：
- 只保留高层摘要
- 不堆长过程、不堆大段细节
- 更像“长期总览 + 索引”

### typed memory → `memory/typed/*`
适合记录：
- 跨会话仍然有价值的信息
- 可以明确归类的稳定知识
- 从 daily notes 中提炼出来的长期结论

分类：
- `user/`：用户背景、偏好、习惯
- `feedback/`：用户对助手工作方式的纠正与要求
- `project/`：项目长期上下文、架构决策、阶段结论
- `reference/`：仓库、文档、外部系统入口

### procedures → `memory/bank/procedures/*`
适合记录：
- 会被重复执行的方法
- 稳定 SOP
- 排障步骤
- 环境检查流程

## 2. 不该长期记什么

以下内容默认不要进长期记忆：
- 大段代码
- 整段聊天记录
- Git 历史
- 临时任务状态
- 未验证猜测
- 已经有正式文档承载且无需重复索引的细枝末节

## 3. 提炼节奏

### 默认流程
1. 先把当天信息写到 daily notes
2. 如果发现“明天、下周、下个月还值得记住”，再提炼到 typed memory
3. 如果它已经是高层稳定结论，再更新 MEMORY.md
4. 如果它是可复用方法，再写 procedures

### 轻判断问题
遇到一条信息时，按这几个问题判断：
1. 这是不是只对今天有用？
   - 是 → daily notes
2. 这是不是跨会话还会有价值？
   - 是 → typed memory
3. 这是不是长期稳定结论或总览级信息？
   - 是 → MEMORY.md
4. 这是不是会重复执行的方法？
   - 是 → procedures

## 4. 维护频率

建议节奏：
- **daily**：需要时写 `memory/YYYY-MM-DD.md`
- **every 1-3 days**：从 recent daily notes 提炼少量 typed memory
- **weekly / when major change happens**：更新 `MEMORY.md`
- **when a workflow repeats twice or more**：考虑写 `procedures/`

## 5. 控制原则

- 少量高价值，胜过大量堆积
- 宁可晚一点提炼，也不要把噪音写进长期记忆
- 同一条信息尽量只保留一个权威位置
- MEMORY.md 负责概览，不负责承载全部细节
- typed memory 负责结构化沉淀，不负责原始日志

## 6. 推荐最小闭环

一次完整记忆维护，最多做这几步：
1. 看最近 1-2 天的 daily notes
2. 提炼 1-3 条真正长期有价值的信息
3. 分流到 `typed/*` 或 `procedures/*`
4. 只有在高层结论变化时才更新 `MEMORY.md`

保持轻。不要把 memory maintenance 做成一次大型档案工程。
