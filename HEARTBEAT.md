# HEARTBEAT.md - 精简心跳任务清单

每隔一段时间（约 60 分钟）自动检查少量高价值任务，保持主会话轻、短、可收口。

## 自动化机制
- OpenClaw 配置 `agents.defaults.heartbeat.enabled: true`
- 每 60 分钟自动触发轮询
- heartbeat 只负责：check / route / notify
- heartbeat 不是排障 worker，不是长分析线程，不是自动修复总控
- 维护/清理/恢复类执行任务优先放到独立 cron 或 session-maintenance，不要塞回 heartbeat task 列表

## 手动调试
```bash
node /Users/mac/.openclaw/workspace/impl/bin/heartbeat-cli.js [status|check|run|tasks]
```

---

## tasks

- name: context-pressure-check
  interval: 6h
  priority: low
  prompt: "仅做轻量检查。必须先确保脚本路径存在；若 `/Users/mac/.openclaw/workspace/impl/bin/compact-cli.js` 不存在则直接跳过并返回正常，不要报错、不重试、不替代为别的路径。只有结果明确显示 needsAction=true 或 urgency >= 2 时，才发出一句简短提醒。不要在 heartbeat 中展开分析。"

- name: memory-maintenance
  interval: 24h
  priority: low
  prompt: "检查 `memory/heartbeat-state.json` 的 `lastMemoryReview`。如果状态文件不存在，可以跳过或初始化最小状态，不要报错刷屏。只有距离上次回顾超过 24 小时时，才读取最近 1-2 天 daily notes，提炼少量长期有价值的信息更新 MEMORY.md。不要做大规模历史回放。"

- name: doctor-check
  interval: 72h
  priority: low
  prompt: "仅在轻量前提下运行一次系统检查（如 `openclaw doctor --non-interactive`）。若最近 72 小时内已检查过则跳过。只有出现新的 critical / 明显异常时，才发送简短诊断通知。不要在 heartbeat 中展开完整排障链路。"

- name: no-heavy-repair
  interval: 24h
  priority: low
  prompt: "heartbeat 只负责 check / route / notify。不要在 heartbeat 中执行配置修改、日志深追、批量清理、长输出命令或连续 3 步以上排查。遇到这类需求时只给一句提醒，转主线程或独立任务。"

---

## 执行硬规则

- 每次心跳最多检查 1-2 个任务
- 必须先运行 `heartbeat-cli.js check` 再决定是否继续
- 脚本不存在、路径错误、状态文件缺失时：不要循环重试，不要扩散为更多任务
- 只有在“有明确异常 / 有明确完成结果”时才主动通知用户
- 如果一切正常，返回 `HEARTBEAT_OK`
- 不要根据旧聊天内容推断今天该做什么
- 不要在 heartbeat 中执行连续 3 步以上排查
- 一旦需要连续 3 步以上诊断、日志追踪、配置修改或长分析：立即停止 heartbeat 内展开，转独立线程 / cron isolated / 后续主线程处理
- 保持主会话轻量，避免把 heartbeat 变成后台总控
- `memory/heartbeat-state.json` 作为 heartbeat 轻状态主文件；避免与其他通用 state 文件重复承担同类节流/已执行判断
- `state/heartbeat-state.json` 仅保留兼容占位，不再作为主判断来源
