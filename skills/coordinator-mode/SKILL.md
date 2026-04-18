---
name: coordinator-mode
description: "Claude Code 多代理协调模式，管理 Worker 工具权限和会话模式切换 Use when [coordinator mode] is needed."
version: 1.0.0
phase: 9
priority: high
source: Claude Code coordinator/coordinatorMode.ts
borrowed_patterns:
  - isCoordinatorMode
  - matchSessionMode
  - getCoordinatorUserContext
  - getCoordinatorSystemPrompt
---

# Coordinator Mode - 多代理协调模式

## 功能概述

借鉴 Claude Code 的 Coordinator Mode，实现多代理协作时的统一管理：
- Worker 工具权限控制
- 会话模式切换/恢复
- Scratchpad 目录共享
- MCP 工具分配

## 核心模式

### 1. isCoordinatorMode - 检测协调模式

```typescript
// 检查环境变量或配置
isCoordinatorMode(): boolean

// 用法
if (isCoordinatorMode()) {
  // 进入协调逻辑
  const context = getCoordinatorUserContext(mcpClients)
}
```

### 2. matchSessionMode - 匹配会话模式

```typescript
// 会话恢复时匹配存储的模式
matchSessionMode(sessionMode: 'coordinator' | 'normal'): string | undefined

// 返回: 如果切换了模式，返回警告消息；否则 undefined
const warning = matchSessionMode('coordinator')
if (warning) {
  console.log(warning) // "已进入协调模式以匹配恢复的会话"
}
```

### 3. Worker 工具控制

```typescript
// 设置 Worker 可用工具
setWorkerTools('basic') // Bash, Read, Edit
setWorkerTools('full')  // 包含 Glob, Grep, Skill 等

// 检查工具可用性
isToolAvailableForWorker('Bash') // true

// 过滤工具列表
const filtered = filterToolsForWorker(['Bash', 'TeamCreate'])
// ['Bash'] — TeamCreate 是内部工具，不显示
```

### 4. 系统提示生成

```typescript
// 获取协调器系统提示
const prompt = getCoordinatorSystemPrompt()
// 包含: 角色、工具、Worker、任务流程、并发管理
```

## 飞书集成

### 接入 sessions_spawn

```typescript
import { createCoordinatorHook } from './coordinator-service'

const hook = createCoordinatorHook()

// 在 sessions_spawn 前调用
const { allowedTools } = hook.beforeSpawn({
  agentId: 'worker-001',
  description: '研究认证问题',
  mode: 'worker'
})

// 限制 Worker 工具
spawnParams.tools = allowedTools
```

### 飞书卡片通知

```typescript
// 会话统计卡片
const stats = getSystemStats()

// 发送飞书卡片
message({
  action: 'send',
  card: {
    title: '协调器状态',
    content: `模式: ${stats.state.mode}
Workers: ${stats.sessionStats.workersSpawned}
平均每会话: ${stats.sessionStats.avgWorkersPerSession}`
  }
})
```

## 状态文件

位置: `memory/coordinator-state.json`

```json
{
  "mode": "normal",
  "sessionCount": 5,
  "workersSpawned": 12,
  "lastModeSwitch": null,
  "workerTools": ["Bash", "Read", "Edit"],
  "mcpClients": ["github", "filesystem"]
}
```

## 使用场景

### 1. 多代理研究任务

```
用户: 分析这个项目的架构问题

协调器:
  启动 Worker 1: 研究目录结构
  启动 Worker 2: 研究 API 设计
  启动 Worker 3: 研究依赖关系
  
[等待 Worker 结果]

协调器: 综合发现，制定重构建议...
```

### 2. 会话恢复

```
用户恢复上次会话

协调器检测 sessionMode = 'coordinator'
matchSessionMode('coordinator')
→ 自动切换到协调模式
```

### 3. Worker 工具限制

```
Coordinator 配置:
  workerTools: ['Bash', 'Read', 'Edit']
  
Worker 请求 Grep 工具:
  isToolAvailableForWorker('Grep') → false
  Worker 被限制为只读操作
```

## 与 OpenClaw 集成

### HEARTBEAT.md 添加检查

```yaml
- name: coordinator-stats
  interval: 1h
  prompt: "Check coordinator-state.json. If mode === 'coordinator', send Feishu card with worker stats and recent events"
```

### impl/utils/index.ts 添加入口

```typescript
export * as coordinator from './coordinator-service'

// 用法
import { coordinator } from './impl/utils'
coordinator.isCoordinatorMode()
coordinator.getCoordinatorSystemPrompt()
```

## 性能指标

| 操作 | 预期耗时 | Ops/sec |
|------|---------|---------|
| isCoordinatorMode | < 0.01ms | 100M+ |
| matchSessionMode | < 0.1ms | 10M+ |
| getCoordinatorUserContext | < 1ms | 1M+ |
| getCoordinatorSystemPrompt | < 2ms | 500K+ |

## 与 Claude Code 对比

| 功能 | Claude Code | OpenClaw | 状态 |
|------|-------------|----------|------|
| isCoordinatorMode | env 检测 | env + config | ✅ |
| matchSessionMode | env 切换 | env + state | ✅ |
| Worker Tools | 13+ | 6+ | ⚠️ 简化 |
| System Prompt | 400+ lines | 200+ lines | ⚠️ 简化 |
| Scratchpad | 目录共享 | 配置项 | ⚠️ 待实现 |

## 下一步

1. 接入 OpenClaw `sessions_spawn` API
2. 飞书卡片显示 Worker 状态
3. Scratchpad 目录实际实现
4. 更多 Worker 工具支持

---

生成时间: 2026-04-13 20:25
状态: Phase 9 实现完成 ✅