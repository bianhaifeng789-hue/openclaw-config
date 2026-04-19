---
name: swarm-service
description: "Swarm Service - Multi-agent collaboration system with backend detection, teammate management, reconnection mechanism, and swarm orchestration. Use when [swarm service] is needed."
metadata:
  openclaw:
    emoji: "🐝"
    triggers: [multi-agent, swarm, teammate]
    priority: high
    imports:
      - impl/utils/swarm-service.ts
---

# Swarm Service Skill

多代理协作系统 - 借鉴 Claude Code 的 Swarm 架构。

## 核心功能

| 功能 | 说明 |
|-----|-----|
| Backend Detection | 检测可用后端 |
| Teammate Management | 创建和管理队友 |
| Reconnection | 断线重连 |
| Swarm Orchestration | 多任务编排 |

---

## 后端类型

| 类型 | 说明 |
|-----|-----|
| `in_process` | 进程内（同 session） |
| `remote_process` | 远程进程（SSH） |
| `cloud_api` | 云 API（Claude.ai） |
| `acp_harness` | ACP harness（Codex/Cursor） |

---

## 队友角色

| 角色 | 说明 |
|-----|-----|
| `researcher` | 研究员 - 搜索调研 |
| `planner` | 规划者 - 制定计划 |
| `implementer` | 实现者 - 编写代码 |
| `reviewer` | 审查者 - 检查质量 |
| `tester` | 测试者 - 运行测试 |
| `documenter` | 文档编写者 |
| `coordinator` | 协调者 - 统筹任务 |

---

## 使用方式

### 1. 创建 Swarm 计划

```typescript
import { createSwarmPlan, executeSwarmPlan } from './swarm-service'

const plan = createSwarmPlan(
  'Implement new feature',
  [
    { role: 'researcher', task: 'Research best practices' },
    { role: 'planner', task: 'Create implementation plan' },
    { role: 'implementer', task: 'Write code' },
    { role: 'tester', task: 'Run tests' }
  ],
  'sequential'
)

const result = await executeSwarmPlan(plan)
```

### 2. 创建队友

```typescript
import { createTeammate, startTeammate } from './swarm-service'

const teammate = createTeammate('researcher', 'Search for similar implementations')
await startTeammate(teammate)
```

---

## 布局类型

| 布局 | 说明 |
|-----|-----|
| `parallel` | 并行执行（同时） |
| `sequential` | 顺序执行（一个接一个） |
| `hierarchical` | 层级执行（有依赖） |

---

## 借鉴 Claude Code

| Claude Code | OpenClaw |
|-------------|----------|
| `swarm/backends/detection.ts` | `detectBackends()` |
| `swarm/backends/registry.ts` | `registerBackend()` |
| `swarm/teammateInit.ts` | `createTeammate()` |
| `swarm/reconnection.ts` | `startReconnection()` |

---

## 代码位置

- `impl/utils/swarm-service.ts`