# MEMORY.md - Long-Term Memory

_Last updated: 2026-04-20 10:18_

---

## Core Context

### User Profile
- Timezone: Asia/Shanghai
- Primary language: Chinese
- Preferred style: 高信息密度、少空话、直接推进

### Workspace Focus
- 当前核心工作区围绕 **OpenClaw Workspace-Dispatcher** 展开
- 重点方向包括：OpenClaw agent 实现、heartbeat 调度、healthcheck / watchdog、session/context 维护
- 设计偏好：**渐进式增强**，避免一次性重构或引入第二套平行系统

### Memory System Direction
- 当前长期记忆主路径仍是：`MEMORY.md` + `memory/YYYY-MM-DD.md`
- 已新增轻量结构化目录：
  - `memory/typed/user/`
  - `memory/typed/feedback/`
  - `memory/typed/project/`
  - `memory/typed/reference/`
  - `memory/bank/procedures/`
- 这套结构优先解决“分类清晰”和“长期可维护”，暂不急于引入更重的外部 memory runtime
- 日常维护规则见：`docs/memory-maintenance-rules.md`

## Durable Decisions

### Harness Engineering Migration
- 截至 2026-04-17，Harness Engineering 核心迁移已完成
- 早期复盘发现覆盖率并非预期 100%，而是约 60%
- 核心缺口集中在 4 个关键文件，后续已补齐
- 当前应以“核心文件已补齐、迁移完成”作为主结论
- 详细迁移说明见：
  - `memory/typed/project/harness-engineering-migration.md`
  - `memory/typed/reference/harness-engineering-repo.md`

### Heartbeat Strategy
- heartbeat 只做 **check / route / notify**
- 不在 heartbeat 中展开重排障、配置修改或长日志分析
- 复杂诊断转独立线程、任务或 runbook
- 详细说明见：`memory/typed/project/heartbeat-infrastructure.md`

### Memory Architecture Choice
- 当前采用“轻量结构化记忆”方案，而不是立即接入重型 memory engine
- `claude-memory-pro` 可参考其分类思想，但不适合原样重度采用
- `mnemon` 值得继续关注，但在未做隔离验证前，不直接接入主环境
- 相关评估文档：
  - `docs/memory-architecture-proposal.md`
  - `docs/mnemon-openclaw-assessment.md`

## Key References

- `memory/typed/user/profile.md`
- `memory/typed/feedback/response-style.md`
- `memory/typed/project/openclaw-workspace-dispatcher.md`
- `memory/typed/reference/openclaw-entrypoints.md`
- `memory/bank/procedures/openclaw-healthcheck.md`

## Notes

`MEMORY.md` 现在作为高层摘要与索引使用：
- 放长期有效的背景、决策、稳定偏好
- 详细项目结论拆到 `memory/typed/*`
- 原始过程与当天记录留在 `memory/YYYY-MM-DD.md`
