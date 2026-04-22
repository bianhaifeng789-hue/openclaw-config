# HEARTBEAT.md - 精简心跳任务清单

每隔一段时间（约 30 分钟）自动检查少量高价值任务，保持主会话轻、短、可收口。

## 自动化机制
- OpenClaw 配置 `agents.defaults.heartbeat.enabled: true`
- 每 30 分钟自动触发轮询
- heartbeat 只负责：check / route / notify
- heartbeat 不是排障 worker，不是长分析线程，不是自动修复总控
- 若检测到疑似“卡死 / 假掉线 / 主 session 过重”，先按 `RUNBOOK-openclaw-auto-recovery.md` 的 Level 0/1 执行，只做轻量分类与必要提醒，不在 heartbeat 内展开重修复
- 若结果明显指向 session 偏重，只做简短收口提醒，建议用户或同事用 `/new` 开新线程，不在 heartbeat 内继续长链路处理

## 手动调试
```bash
node /Users/mac/.openclaw/workspace/impl/bin/heartbeat-cli.js [status|check|run|tasks]
```

---

## tasks

- name: compaction-alert-scan
  interval: 15m
  priority: critical
  prompt: "运行 `node /Users/mac/.openclaw/workspace/impl/bin/compaction-alert.js scan`。如果 status=alert 且 level=critical，立刻发飞书通知用户 session 过重建议 /new。warning 级别不通知。这是最高优先级任务，每次心跳必须执行。"
  note: "也已部署为独立 cron job (每15分钟)，heartbeat 作为双保险"

- name: context-pressure-check
  interval: 2h
  priority: medium
  prompt: "仅做轻量检查：运行 `node /Users/mac/.openclaw/workspace/impl/bin/compact-cli.js auto glm-5`。只有结果明确显示 needsAction=true 或 urgency >= 2 时，才发出简短警告或建议分流。若出现明显卡顿体感但 Gateway 仍 reachable，也优先按主 session 过重处理。不要在 heartbeat 中展开长分析。"

- name: memory-maintenance
  interval: 24h
  priority: low
  prompt: "检查 `memory/heartbeat-state.json` 的 `lastMemoryReview`。如果状态文件不存在，可以跳过或初始化最小状态，不要报错刷屏。只有距离上次回顾超过 24 小时时，才读取最近 1-2 天 daily notes，提炼少量长期有价值的信息更新 MEMORY.md。不要做大规模历史回放。"

- name: doctor-check
  interval: 24h
  priority: low
  prompt: "运行一次轻量系统检查（如 `openclaw doctor --non-interactive`）。只有出现新的 critical / 明显异常时，才发送简短诊断通知。若 Gateway running + reachable，则不要把 config conflict 或 session 过重误判成 Gateway 真挂。不要在 heartbeat 中展开完整排障链路。"

---

## 执行硬规则

- 每次心跳最多检查 1-2 个任务
- 必须先运行 `heartbeat-cli.js check` 再决定是否继续
- 脚本不存在、路径错误、状态文件缺失时：不要循环重试，不要扩散为更多任务
- 只有在“有明确异常 / 有明确完成结果”时才主动通知用户
- 如果一切正常，返回 `HEARTBEAT_OK`
- 不要根据旧聊天内容推断今天该做什么
- 不要在 heartbeat 中执行连续 3 步以上排查
- 不要在 heartbeat 中执行 restart、连续 config patch、或长日志深挖
- 一旦需要连续 3 步以上诊断、日志追踪、配置修改或长分析：立即停止 heartbeat 内展开，转独立线程 / cron isolated / 后续主线程处理
- 保持主会话轻量，避免把 heartbeat 变成后台总控
