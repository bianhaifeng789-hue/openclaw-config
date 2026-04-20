# INFRASTRUCTURE-INDEX.md

OpenClaw 基础设施文件索引，减少重复排障与重复解释。

## Health / Runbook
- `RUNBOOK-openclaw-health.md`：健康检查顺序、风险优先级、最小修复策略、复查模板
- `RUNBOOK-openclaw-gateway-false-failure.md`：区分 Gateway 真故障、配置冲突误报、主会话过重导致的假卡死
- `RUNBOOK-openclaw-anti-stall.md`：防卡死操作清单，覆盖 Node / Gateway / session / 配置冲突的预防与最小修复
- `RUNBOOK-openclaw-auto-recovery.md`：卡顿/掉线时的自动分类、最小修复、停止展开边界
- `docs/openclaw-self-heal-setup.md`：本机 launchd 自愈守护安装说明
- `scripts/openclaw-healthcheck.sh`：把 status / doctor / security audit 落盘到 `state/health/`

## Session / Context
- `RUNBOOK-session-context.md`：主会话、独立线程、heartbeat 的分工规则
- `CLOSEOUT-template.md`：结束一段长线程时的收口模板
- `context-hygiene-checklist.md`：判断线程是否过重、是否需要转文件/分流

## Automation
- `HEARTBEAT.md`：heartbeat 的轻量任务边界与硬规则
- `scripts/openclaw-auto-recover.sh`：稳定性分诊主入口，负责自动分类卡顿/掉线体感，并在低风险条件下给出最小修复建议或执行单次修复
- `scripts/openclaw-stability-guard.sh`：给人/看板看的 5 行摘要入口，适合值班、面板、轻量巡检
- `scripts/openclaw-self-heal.sh`：给 launchd 跑的后台保守自愈入口，定时尝试单次 restart / stale lock fix，并写 guard 日志
- `scripts/play-to-prd.sh`：Google Play → 逆向 → PRD 工作流统一入口，提供 check-app / reverse-status / prd-skills / smoke

## Memory
- `memory/2026-04-19.md`：本轮收尾与基础设施整理记录
- `MEMORY.md`：长期规律与稳定结论

## 使用顺序（推荐）
1. 先看 `RUNBOOK-openclaw-health.md`
2. 需要实际检查时运行 `scripts/openclaw-healthcheck.sh`
3. 线程开始变重时看 `context-hygiene-checklist.md`
4. 结束时按 `CLOSEOUT-template.md` 收口
5. 稳定规律写入 `MEMORY.md`，过程写入 daily memory
