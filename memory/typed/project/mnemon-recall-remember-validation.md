---
name: Mnemon Recall/Remember 链路验证结果
type: project
created: 2026-04-20
updated: 2026-04-20
---

2026-04-20 已完成 Mnemon 在当前 OpenClaw 环境下的最小 recall/remember 实测。

Verified:
- `remember` 写入成功
- `recall` 在更贴合 query 的情况下可召回目标记忆
- `search` 也可命中同一条测试记忆

Test memory:
- id: `f798e76c-e8ee-47a0-900a-ba91b2ba4cf2`
- category: `context`
- entities: `Mnemon`, `OpenClaw`

Observed issue:
- 存在偶发 SQLite busy/locked 告警
- 典型表现为：`database is locked` 或 `oplog insert/trim: database is locked`
- 但在后续复测中，warning 存在时 recall 仍可能成功返回结果

How to apply:
- 当前可判定 Mnemon 主链路已通，但稳定性需继续观察
- 近期保持保守配置：`remind=true`、`nudge=false`、`compact=false`
- 若后续锁告警频繁影响体验，再评估是否回滚或继续排障
