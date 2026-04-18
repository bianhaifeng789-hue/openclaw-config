---
name: use-swarm-initialization-hook
description: "Swarm初始化Hook。初始化多Agent协作模式，设置协调策略。Use when initializing swarm coordination mode."
---

# Use Swarm Initialization Hook

## 功能

初始化Swarm协作模式。

### 配置项

- agentCount - Agent数量（2-5）
- coordinationStrategy - 协调策略（parallel/sequential/hybrid）
- taskDistribution - 任务分配方式（auto/manual/balanced）
- timeout - 全局超时时间

### 使用示例

```javascript
// 初始化Swarm
initSwarm({
  agents: 3,
  strategy: 'parallel',
  taskDistribution: 'auto',
  timeout: 300
});

// 返回配置
{
  agentsCreated: 3,
  strategy: 'parallel',
  ready: true,
  coordinator: 'swarm-001'
}
```

### 协调策略

- parallel - 并行执行
- sequential - 顺序执行
- hybrid - 混合模式

---

来源: Claude Code hooks/useSwarmInit.ts