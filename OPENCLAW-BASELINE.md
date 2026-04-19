# OPENCLAW-BASELINE.md

这台 OpenClaw main 的当前稳定基线（只记录已落地、已验证的内容）。

更新时间：2026-04-19

## 1. 运行与暴露面基线

- Gateway mode: `local`
- Gateway bind: `loopback`
- Dashboard: `http://127.0.0.1:18789/`
- Gateway auth: `token`
- 当前原则：默认只保留本地回环暴露；远程访问优先 tunnel / tailscale，不直接开放 LAN

## 2. 渠道访问控制基线

### Feishu
- channel: `feishu`
- `dmPolicy = allowlist`
- `allowFrom = ["ou_20ce8ae181b9a6ee6bd380206dad72c6"]`
- `resolveSenderNames = false`

当前结论：
- `doctor` 已无 channel security warnings
- Feishu 作为当前直连渠道可正常工作

## 3. Memory 基线

- `agents.defaults.memorySearch.enabled = false`
- `plugins.slots.memory = "none"`
- `status` 现应显示：`Memory: disabled (plugins.slots.memory="none")`
- `doctor` 现应显示：`Memory search is explicitly disabled (enabled: false)`

当前原则：
- 不用就彻底关
- 要用就完整启用并验证
- 不允许长期处于“plugin 开着、feature 关着”的半开状态

## 4. 插件基线

- `plugins.enabled = true`
- `plugins.allow = ["feishu", "codex"]`
- 当前 memory 插件 slot 已显式关闭，不再默认回落到 `memory-core`

## 5. 心跳基线

Heartbeat 只做：check / route / notify。

### 当前最小任务面（3 个）
- `context-pressure-check`
- `memory-maintenance`
- `doctor-check`

### 心跳硬规则
- 每次心跳最多检查 1-2 个任务
- 先 `heartbeat-cli.js check`，再决定是否继续
- 不做连续 3 步以上诊断
- 没有明确异常或明确结果时，保持安静

## 6. Session / Context 基线

- 主会话只保留：结论、决策、下一步
- 长日志 / 多轮试错 / 深诊断：外置到文件或独立线程
- Heartbeat 不做长排障
- 收口时使用 `CLOSEOUT-template.md`

## 7. 模型路由基线

见：`MODEL-ROUTING.md`

当前主链：
- primary: `lucen/gpt-5.4`
- fallback 1: `openai_balance/gpt-5.4`
- fallback 2: `bailian/glm-5`

## 8. Guardrail 脚本基线

- `scripts/openclaw-healthcheck.sh`
  - 作用：把 `status` / `doctor` / `security audit` 输出落盘到 `state/health/`

- `impl/bin/health-monitor-lite.js`
  - 作用：只读汇总 gateway / session pressure / heartbeat state
  - 默认不跑 doctor；传 `--doctor` 才附带 doctor 摘要
  - 不自动修复、不 restart gateway、不接管 heartbeat

- `impl/bin/session-pressure.js`
  - 作用：只读查看 session context 占用、压力分级、compaction 次数
  - 用于人工判断是否需要后续 compact / closeout
  - 不自动 compact、不修改 session

- `scripts/archive-orphan-checkpoints.py`
  - 作用：只归档 `*.checkpoint.*.jsonl`
  - 默认 dry-run
  - 不碰 active main transcript

- `scripts/heartbeat-state-guard.py`
  - 作用：校验/规范化 `memory/heartbeat-state.json`
  - 最小 schema：`lastChecks` / `lastNotices` / `notes`

- `scripts/heartbeat-integrity-check.py`
  - 作用：检查 heartbeat 主链任务面、旧任务回流、state schema 漂移

## 9. 当前低风险尾项

以下属于非阻塞项，不视为当前主故障：
- doctor 偶尔提示新的 orphan checkpoint transcript
- reverse proxy / trusted proxies 提醒（在 loopback 本地模式下不是阻塞项）
- Feishu doc tool 的能力提醒（是可知风险，不是当前异常）

## 10. 推荐使用顺序

1. 先看 `RUNBOOK-openclaw-health.md`
2. 需要检查时跑 `scripts/openclaw-healthcheck.sh`
3. 线程过重时看 `RUNBOOK-session-context.md`
4. 收口时用 `CLOSEOUT-template.md`
5. 长期规律写 `MEMORY.md`，过程写 daily memory
