# CAPABILITIES-openclaw-main.md

这台 OpenClaw main 当前已落地、可直接使用的能力清单。

更新时间：2026-04-19

> 只记录已经落地并验证过的能力；不记录愿景，不记录未部署假设。

## 1. 健康检查与诊断

### 已可用
- `openclaw status`
- `openclaw doctor --non-interactive`
- `openclaw security audit --deep`
- `scripts/openclaw-healthcheck.sh`
- `impl/bin/health-monitor-lite.js`
- `impl/bin/session-pressure.js`

### 作用
- 查看运行总览
- 做轻量诊断
- 做深度安全审计
- 生成健康检查落盘报告

## 2. Session / Context 治理

### 已可用
- `RUNBOOK-session-context.md`
- `CLOSEOUT-template.md`
- `context-hygiene-checklist.md`

### 当前原则
- 主线程保留结论，不堆长日志
- 多轮技术排查应分流
- heartbeat 只做轻量 check / route / notify

## 3. Heartbeat 轻量执行面

### 当前任务面（3）
- `context-pressure-check`
- `memory-maintenance`
- `doctor-check`

### 当前保障
- `HEARTBEAT.md` 已和真实脚本路径对齐
- CLI / executor / scheduler / integration 已做最小化收敛
- `scripts/heartbeat-integrity-check.py` 可做只读完整性检查

## 4. Heartbeat 状态治理

### 已可用
- `scripts/heartbeat-state-guard.py`

### 当前最小 schema
- `lastChecks`
- `lastNotices`
- `notes`

### 目标
- 防止旧字段、旧任务模型、旧状态结构回流

## 5. Session artifact 安全清理

### 已可用
- `scripts/archive-orphan-checkpoints.py`

### 当前边界
- 只处理 `*.checkpoint.*.jsonl`
- 默认 dry-run
- 只做 archive rename
- 不碰主 transcript `.jsonl`

## 6. Memory 能力边界

### 当前状态
- memory search: disabled
- memory plugin slot: disabled (`plugins.slots.memory="none"`)

### 当前含义
- 当前系统不依赖 memory-core 运行
- 避免“半开半关”的歧义状态

## 7. 渠道与访问控制

### Feishu
- direct 使用中
- `dmPolicy = allowlist`
- 已限制 `allowFrom`

### 当前结论
- 直连使用可行
- 当前配置较适合单人/受限使用场景

## 8. 模型路由

见：`MODEL-ROUTING.md`

当前已落地：
- primary + 双 fallback
- 目标是稳定可用，不追求过多 provider

## 9. Runbook / Documentation 入口

- `INFRASTRUCTURE-INDEX.md`
- `RUNBOOK-openclaw-health.md`
- `RUNBOOK-session-context.md`
- `OPENCLAW-BASELINE.md`
- `MODEL-ROUTING.md`
- `CAPABILITIES-openclaw-main.md`

## 10. 当前没有引入的东西

以下内容目前**没有**作为这台 main 的正式基线：
- 大规模 heartbeat 任务面
- 自动并行后台总控
- 重型多 agent orchestration
- 外部多存储/多云备份编排
- 自动自反思/自动优化闭环

原因：
- 当前优先级是稳定、可诊断、可收口
- 不主动引入新的复杂度与故障面
