---
name: smart-heartbeat
description: "智能心跳调度器，自动检测并执行 HEARTBEAT.md 任务 Use when [smart heartbeat] is needed."
triggers:
  - heartbeat
  - smart
  - 自动
  - 智能调度
---

# Smart Heartbeat Scheduler

智能心跳调度器，无需手动触发。

## 功能

- **自动检测**: 解析 HEARTBEAT.md 任务定义
- **智能选择**: 按优先级选择待执行任务
- **防重复执行**: 基于 lastRun 时间戳
- **状态持久化**: memory/heartbeat-state.json
- **每次最多 2 任务**: 防止超时

## 自动运行机制

### OpenClaw 配置

```json
{
  "agents": {
    "defaults": {
      "heartbeat": {
        "enabled": true,
        "every": "30m",
        "prompt": "Read HEARTBEAT.md and follow tasks strictly."
      }
    }
  }
}
```

### 运行流程

1. OpenClaw 每 30 分钟触发心跳轮询
2. Agent 收到心跳 prompt
3. 读取 HEARTBEAT.md 任务定义
4. SmartHeartbeatScheduler.check() 检查 pending 任务
5. 自动执行前 2 个高优先级任务
6. 更新 state 文件，防止重复执行

## API

```typescript
import { smartHeartbeatScheduler } from './smart-heartbeat-scheduler';

// 检查待执行任务
const { pending, state } = smartHeartbeatScheduler.check();

// 执行任务
const { executed, skipped, summary } = smartHeartbeatScheduler.run();

// 获取统计
const stats = smartHeartbeatScheduler.getStats();
```

## Stats

- tasksDefined: 任务总数
- lastCheckTime: 最后检查时间
- lastRunTime: 最后执行时间
- pendingCount: 待执行数量
- taskStats: 每个任务的执行次数

## 文件

- `impl/utils/smart-heartbeat-scheduler.ts`
- `memory/heartbeat-state.json` (状态文件)