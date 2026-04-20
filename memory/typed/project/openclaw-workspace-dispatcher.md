---
name: OpenClaw Workspace-Dispatcher 项目概况
type: project
created: 2026-04-20
updated: 2026-04-20
---

当前 workspace 核心项目是 OpenClaw Workspace-Dispatcher，围绕 OpenClaw agent 实现、heartbeat 调度、healthcheck、watchdog、session/context 维护等能力展开。

Key points:
- 需要兼顾主会话轻量化与后台维护能力
- 已存在 MEMORY.md、daily notes、heartbeat-state 等记忆基础设施
- 更适合渐进式增强，而非一次性推翻重建

How to apply:
- 新能力优先做兼容式接入
- 避免引入第二套平行状态系统
- 设计时优先考虑可维护性与长期沉淀
