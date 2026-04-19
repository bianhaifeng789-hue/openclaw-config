---
name: swarm
description: "Multi-agent collaboration with parallel task execution. Spawn multiple sub-agents to work on different aspects of a complex task simultaneously. Uses sessions_spawn for agent orchestration. Use when [swarm] is needed."
metadata:
  openclaw:
    emoji: "🐝"
    triggers: [complex-task, multi-aspect, manual]
    feishuCard: true
---

# Swarm Skill - 多代理协作

多个子代理并行协作，复杂任务分拆执行。

## 为什么需要这个？

**场景**：
- 大型重构任务（多个模块同时修改）
- 并行探索（多个方向同时研究）
- 多文件处理（不同文件不同策略）

**优势**：
- 提高效率（并行而非串行）
- 专业分工（不同 agent 不同任务）
- 结果整合（汇总多 agent 输出）

---

## 核心概念

### Swarm（蜂群）

一组协作的 agent 集合：

```typescript
interface Swarm {
  name: string            // 蜂群名称
  leader: Agent           // 领导者（主 agent）
  workers: Agent[]        // 工作者（子 agent）
  task: string            // 总任务描述
  status: 'forming' | 'working' | 'completed'
}
```

### Agent（代理）

单个 worker：

```typescript
interface Agent {
  id: string              // agent ID（格式：name@team）
  name: string            // 显示名称
  role: string            // 角色（researcher, implementer, reviewer）
  task: string            // 分配任务
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: string         // 执行结果
}
```

---

## 协作模式

### 模式 1：并行探索

```
任务：研究三种认证方案

Leader:
→ 创建 3 个 researcher agents
→ Agent A: 研究 JWT 方案
→ Agent B: 研究 Session 方案
→ Agent C: 研究 OAuth 方案
→ 并行执行
→ 汇总结果
→ 向用户展示三种方案对比
```

### 模式 2：分阶段协作

```
任务：实现新功能

Phase 1: Research
→ researcher agent 探索代码库

Phase 2: Plan
→ planner agent 设计实现方案

Phase 3: Implement
→ implementer agent 执行编码

Phase 4: Review
→ reviewer agent 检查质量

Leader: 整合所有阶段结果
```

### 模式 3：地域分工

```
任务：重构三个模块

→ Agent A: 重构 auth 模块
→ Agent B: 重构 api 模块
→ Agent C: 重构 database 模块
→ 并行执行
→ Leader: 整合检查
```

---

## 使用 sessions_spawn

OpenClaw 已有 `sessions_spawn` 工具支持子代理创建：

```typescript
// 使用 sessions_spawn 创建子代理
sessions_spawn({
  runtime: 'subagent',
  mode: 'run',           // 一次性执行
  task: '探索 auth 模块的依赖关系',
  label: 'researcher-auth',
  agentId: 'researcher@swarm-auth',
  model: 'default',
  timeoutSeconds: 300
})
```

---

## 飞书卡片格式

### 蜂群启动卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🐝 蜂群协作启动**\n\n**任务**：重构认证系统\n\n**Workers**：\n• 🔵 researcher@auth - 探索现有代码\n• 🟢 planner@auth - 设计重构方案\n• 🟡 implementer@auth - 执行编码\n• 🟠 reviewer@auth - 代码检查\n\n**模式**：分阶段协作\n**预计耗时**：15 分钟"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "并行执行中..."}
      ]
    }
  ]
}
```

### Worker 进度卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🐝 蜂群进度更新**\n\n✅ researcher@auth - 完成\n   发现 5 个依赖模块\n\n🟡 planner@auth - 进行中\n   正在分析架构...\n\n⚪ implementer@auth - 待开始\n\n⚪ reviewer@auth - 待开始\n\n**进度**：25% (1/4)"
      }
    }
  ]
}
```

### 结果汇总卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**✅ 蜂群任务完成**\n\n**汇总结果**：\n\n**Researcher 发现**：\n• auth 模块依赖 5 个外部模块\n• 主要使用 JWT 认证\n• 有 3 个安全漏洞\n\n**Planner 方案**：\n• 改用 OAuth 2.0\n• 添加 middleware 层\n• 分 3 步实施\n\n**Implementer 完成**：\n• 重构 3 个核心文件\n• 新增 2 个 middleware\n• 更新 API endpoints\n\n**Reviewer 检查**：\n• ✅ 代码质量良好\n• ✅ 测试通过\n• ⚠️ 建议添加文档\n\n**下一步**：添加 API 文档"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 任务分析

```
Leader:
1. 分析任务复杂度
2. 确定是否需要多代理
3. 规划 agent 分配
```

### 2. 蜂群创建

```
Leader:
1. 创建 swarm 定义
2. 发送飞书卡片："🐝 蜂群协作启动"
3. 为每个 worker 调用 sessions_spawn
4. 记录 agent IDs
```

### 3. 并行执行

```
Workers:
1. 各 agent 执行分配任务
2. Leader 监控进度
3. 定期发送进度卡片
```

### 4. 结果汇总

```
Leader:
1. 收集所有 worker 结果
2. 整合分析
3. 发送汇总卡片
4. 向用户展示
```

---

## Agent 角色类型

| 角色 | 说明 | 典型任务 |
|------|------|----------|
| `researcher` | 研究员 | 探索代码、分析依赖 |
| `planner` | 规划者 | 设计方案、制定计划 |
| `implementer` | 实现者 | 编写代码、执行操作 |
| `reviewer` | 检查者 | 代码审查、质量检查 |
| `tester` | 测试者 | 运行测试、验证结果 |
| `documenter` | 文档者 | 编写文档、注释代码 |

---

## 持久化存储

```json
// memory/swarm-state.json
{
  "activeSwarms": [
    {
      "name": "auth-refactor",
      "task": "重构认证系统",
      "status": "working",
      "leader": "agent:main:main",
      "workers": [
        {
          "id": "researcher@auth-refactor",
          "name": "researcher",
          "role": "researcher",
          "task": "探索依赖关系",
          "status": "completed",
          "result": "发现 5 个依赖模块"
        },
        {
          "id": "planner@auth-refactor",
          "name": "planner",
          "role": "planner",
          "task": "设计重构方案",
          "status": "in_progress"
        }
      ],
      "createdAt": "2026-04-11T23:00:00Z"
    }
  ],
  "completedSwarms": [],
  "stats": {
    "swarmsCreated": 0,
    "workersSpawned": 0,
    "tasksCompleted": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| tmux/iTerm2 panes | sessions_spawn |
| InProcessTeammateTask | subagent runtime |
| AppState.tasks | swarm-state.json |
| 终端 pane 视图 | 飞书卡片展示 |
| 颜色编码 (ANSI) | 飞书卡片 emoji |
| AsyncLocalStorage | 独立 session context |

---

## 使用示例

### 示例 1：并行探索

```
用户：帮我研究三种前端框架的优缺点

Agent:
→ 创建蜂群 "framework-research"
→ 发送启动卡片
→ Spawn 3 个 researcher agents:
   • researcher@react - 研究 React
   • researcher@vue - 研究 Vue
   • researcher@svelte - 研究 Svelte
→ 并行执行（5 分钟）
→ 汇总结果
→ 发送汇总卡片："React 适合大型项目，Vue 易学易用，Svelte 性能最佳"
```

### 示例 2：分阶段协作

```
用户：帮我实现用户认证功能

Agent:
→ 创建蜂群 "auth-implementation"
→ Phase 1: researcher 探索（2 分钟）
→ Phase 2: planner 设计（1 分钟）
→ Phase 3: implementer 编码（5 分钟）
→ Phase 4: reviewer 检查（2 分钟）
→ 每阶段发送进度卡片
→ 最终汇总："认证功能已实现，代码质量良好"
```

### 示例 3：地域分工

```
用户：帮我重构 auth、api、database 三个模块

Agent:
→ 创建蜂群 "module-refactor"
→ Spawn 3 个 implementer agents 并行
→ Agent A: refactor auth
→ Agent B: refactor api
→ Agent C: refactor database
→ 同时执行（节省时间）
→ 汇总检查："三个模块已重构，建议运行测试"
```

---

## 配置

```yaml
swarm:
  enabled: true
  maxWorkers: 5            # 最大 worker 数
  defaultTimeout: 300      # 默认超时（秒）
  progressInterval: 60     # 进度更新间隔（秒）
  parallelMode: true       # 默认并行执行
  roles:
    - researcher
    - planner
    - implementer
    - reviewer
    - tester
    - documenter
```

---

## 注意事项

1. **成本控制**：多个 agent 会增加 token 消耗
2. **超时设置**：避免 worker 长时间挂起
3. **结果整合**：需要有效汇总多 agent 输出
4. **冲突处理**：并行修改同一文件时的冲突
5. **进度可见**：定期向用户展示进度

---

## 自动启用

此 Skill 在检测到复杂多方面任务时自动建议创建蜂群，或用户请求"并行执行"、"多 agent 协作"。

---

## 下一步增强

- Worker 间通信机制
- 动态 worker 分配（根据进度调整）
- 失败重试策略
- 成本预估（多 agent token 消耗）