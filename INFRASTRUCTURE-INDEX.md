# INFRASTRUCTURE-INDEX.md

OpenClaw 基础设施文件索引，减少重复排障与重复解释。

## Health / Runbook
- `RUNBOOK-openclaw-health.md`：健康检查顺序、风险优先级、最小修复策略、复查模板
- `RUNBOOK-openclaw-gateway-false-failure.md`：区分 Gateway 真故障、配置冲突误报、主会话过重导致的假卡死
- `RUNBOOK-openclaw-anti-stall.md`：防卡死操作清单，覆盖 Node / Gateway / session / 配置冲突的预防与最小修复
- `scripts/openclaw-healthcheck.sh`：把 status / doctor / security audit 落盘到 `state/health/`

## Session / Context
- `RUNBOOK-session-context.md`：主会话、独立线程、heartbeat 的分工规则
- `CLOSEOUT-template.md`：结束一段长线程时的收口模板
- `context-hygiene-checklist.md`：判断线程是否过重、是否需要转文件/分流

## Automation
- `HEARTBEAT.md`：heartbeat 的轻量任务边界与硬规则

## Memory
- `memory/2026-04-19.md`：本轮收尾与基础设施整理记录
- `MEMORY.md`：长期规律与稳定结论

## 使用顺序（推荐）
1. 先看 `RUNBOOK-openclaw-health.md`
2. 需要实际检查时运行 `scripts/openclaw-healthcheck.sh`
3. 线程开始变重时看 `context-hygiene-checklist.md`
4. 结束时按 `CLOSEOUT-template.md` 收口
5. 稳定规律写入 `MEMORY.md`，过程写入 daily memory
