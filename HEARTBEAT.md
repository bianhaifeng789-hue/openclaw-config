# HEARTBEAT.md - 心跳任务清单

每隔一段时间（约 30 分钟）自动检查以下任务。

## 核心任务（保留）

### P0 必执行
- name: health-monitor
  interval: 5m
  priority: critical
  cmd: node impl/bin/health-monitor.js check

### P1 定期执行
- name: memory-compact
  interval: 6h
  priority: high
  cmd: node impl/bin/compact-cli.js memory

- name: memory-maintenance
  interval: 6h
  priority: high
  cmd: node impl/bin/memory-maintenance-cli.js check

- name: idle-session-compact
  interval: 6h
  priority: medium
  cmd: node impl/bin/idle-session-compact.js check

### P2 低频执行
- name: auto-dream
  interval: 24h
  priority: low
  cmd: node impl/bin/auto-dream-cli.js check

- name: extract-memories
  interval: 12h
  priority: low
  cmd: node impl/bin/extract-memories-cli.js run

- name: heartbeat-check
  interval: 6h
  priority: low
  cmd: node impl/bin/heartbeat-cli.js check

- name: task-visualizer
  interval: 6h
  priority: low
  cmd: node impl/bin/heartbeat-cli.js tasks

### P3 基础设施优化（新增）
- name: cache-lru-cleanup
  interval: 5m
  priority: low
  cmd: node impl/bin/cache-lru-manager.js cleanup

- name: checkpoint-cleanup
  interval: 24h
  priority: low
  cmd: node impl/bin/checkpoint-cleaner.js cleanup

- name: transcript-compress
  interval: 12h
  priority: low
  cmd: node impl/bin/transcript-compressor.js check

- name: archive-cleanup
  interval: 24h
  priority: low
  cmd: node impl/bin/archive-cleaner.js cleanup

- name: session-store-flush
  interval: 5m
  priority: low
  cmd: node impl/bin/session-store-manager.js flush

### P4 架构级优化（P3 - 分布式存储）
- name: sqlite-cleanup
  interval: 24h
  priority: low
  cmd: node impl/bin/sqlite-session-store.js cleanup

- name: distributed-backup
  interval: 6h
  priority: low
  cmd: node impl/bin/distributed-backup.js backup

### P5 可观测性优化（Tracing + Reflection）
- name: tracing-cleanup
  interval: 24h
  priority: low
  cmd: node impl/bin/tracing-system.js cleanup

- name: reflection-summary
  interval: 6h
  priority: low
  cmd: node impl/bin/reflection-system.js history

---

## 执行规则

1. 每次心跳只执行 1-2 个任务（按优先级）
2. 必须先运行 `heartbeat-cli.js check` 确认需处理任务
3. 有重要发现主动通知用户，否则返回 HEARTBEAT_OK

---

## 详细配置

任务详细配置（prompt、参数）已迁移到：
- `config/heartbeat-tasks.json` - 任务定义
- `memory/heartbeat-state.json` - 执行状态

---

## 手动调试

```bash
node impl/bin/heartbeat-cli.js status   # 查看状态
node impl/bin/heartbeat-cli.js check    # 检查需处理任务
node impl/bin/heartbeat-cli.js run      # 执行任务
node impl/bin/heartbeat-cli.js tasks    # 查看活动任务
```

---

创建时间：2026-04-14
优化时间：2026-04-18（从 365 行精简到 60 行）