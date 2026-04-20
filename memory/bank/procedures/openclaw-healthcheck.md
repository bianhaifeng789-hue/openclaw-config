---
name: OpenClaw 健康检查流程
type: procedure
created: 2026-04-20
updated: 2026-04-20
---

目的：
对 OpenClaw 当前运行状态进行轻量、可重复的基础检查。

步骤：
1. 先查看本地入口文档：
   - RUNBOOK-openclaw-health.md
   - INFRASTRUCTURE-INDEX.md
2. 运行状态检查：
   - `openclaw status`
3. 如需轻量汇总：
   - `scripts/openclaw-healthcheck.sh`
   - 或 `node /Users/mac/.openclaw/workspace/impl/bin/health-monitor-lite.js`
4. 若发现问题，再决定是否进入独立排障线程

注意：
- heartbeat 中只做 check / route / notify
- 不要在 heartbeat 中展开重排障
- 长日志和多步诊断应收敛到独立线程或文档
