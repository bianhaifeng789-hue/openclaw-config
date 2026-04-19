---
name: spawn-multi-agent-pattern
description: "多Agent并发模式。同时创建多个子Agent处理并行任务，提升处理效率。Use when executing parallel tasks with multiple agents."
---

# Spawn Multi Agent Pattern

## 功能

并发创建多个Agent。

### 使用场景

- 并行分析多个数据源
- 多任务同时处理
- 分布式计算任务
- 批量操作并行执行

### 配置示例

```javascript
spawnMultiAgent([
  {
    task: '分析ROI数据',
    runtime: 'subagent',
    timeout: 120
  },
  {
    task: '生成LTV报告',
    runtime: 'subagent',
    timeout: 120
  },
  {
    task: '测试运营脚本',
    runtime: 'subagent',
    timeout: 60
  }
]);
```

### 控制参数

- maxAgents - 最大并发数（默认3）
- timeout - 单个超时时间
- priority - 任务优先级
- dependencies - 任务依赖关系

---

来源: Claude Code patterns/spawnMultiAgent.ts