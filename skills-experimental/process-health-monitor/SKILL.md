---
name: process-health-monitor
description: "进程健康监控与自动修复，监控 Gateway/Node 卡死并自动重启 Use when [process health monitor] is needed."
triggers:
  - health
  - monitor
  - restart
  - gateway
  - 卡死
  - 自动修复
---

# Process Health Monitor

进程健康监控与自动修复系统。

## 监控目标

- **OpenClaw Gateway** - HTTP/WebSocket 心跳探测
- **Node.js 子进程** - 进程存活检查

## 检测机制

| 检测类型 | 阈值 | 动作 |
|----------|------|------|
| 无响应 | 30 秒超时 | 重启 |
| CPU 高负载 | > 90% | 告警 |
| 内存高占用 | > 500MB | 告警 |
| 进程终止 | 检查信号 0 | 告警/忽略 |

## 自动修复流程

```
检测卡死 → SIGTERM 优雅关闭 (5秒)
    ↓
未响应 → SIGKILL 强制终止 (2秒)
    ↓
重启进程 → openclaw gateway start
    ↓
验证新进程 → 检查新 PID
    ↓
记录日志 + 发送飞书通知
```

## 配置

```typescript
const config = {
  gatewayPort: 18789,
  heartbeatTimeoutMs: 30000,
  cpuThresholdPercent: 90,
  memoryThresholdMB: 500,
  maxRestartAttempts: 3,
  enableAutoRecovery: true,
};
```

## API

```typescript
import { processHealthMonitor, runHealthCheck } from './process-health-monitor';

// 执行健康检查
const result = await processHealthMonitor.check();

// 自动修复
if (!result.healthy) {
  const actions = await processHealthMonitor.recover(result.issues);
}

// 快速检查（集成到 heartbeat）
const summary = await runHealthCheck();
```

## Stats

- totalChecks: 总检查次数
- issuesDetected: 检测到的问题数
- recoveriesPerformed: 执行的修复数
- successfulRecoveries: 成功修复数
- failedRecoveries: 失败修复数

## 文件

- `impl/utils/process-health-monitor.ts`
- `memory/health-monitor-state.json` (状态)
- `memory/health-monitor.log` (日志)