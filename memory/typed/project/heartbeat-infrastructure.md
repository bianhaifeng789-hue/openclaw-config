---
name: Heartbeat 基础设施概况
type: project
created: 2026-04-20
updated: 2026-04-20
---

当前 workspace 中 heartbeat 是轻量 check / route / notify 机制，不应演化为后台总控或重排障执行器。

Key points:
- Active tasks 曾包含 health-monitor、away-summary、rate-limit-check、memory-maintenance 等
- `HEARTBEAT.md` 是任务定义入口
- `memory/heartbeat-state.json` 是轻量节流状态文件
- 设计原则是主会话保持轻量，复杂诊断进入独立线程/任务

How to apply:
- 新增 heartbeat 能力时优先考虑节流、轻量和可收口
- 不要把多步诊断、配置修改、长日志分析塞进 heartbeat
