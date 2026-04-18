---
name: query-engine
description: "子查询引擎，支持并行查询处理和 Token 预算管理 Use when [query engine] is needed."
triggers:
  - query
  - subquery
  - 子查询
  - 并行查询
  - 预算管理
---

# Query Engine Service

子查询引擎，借鉴 Claude Code 的 query/ 模块。

## 功能

- **并行子查询**: 同时执行多个查询请求
- **Token 预算**: 自动跟踪 Token 使用，提醒预算耗尽
- **配置快照**: 运行时 gates 配置，支持流式执行
- **停止钩子**: 查询结束时的回调处理

## 使用场景

- 需要并行处理多个独立查询
- Token 预算管理，避免超限
- 子任务分发与结果聚合

## API

```typescript
import { QueryEngine, queryEngineService } from './query-engine-service';

// 创建引擎
const engine = queryEngineService.createEngine('session-id', 10000);

// 创建子查询
const q1 = engine.createSubQuery('查找用户偏好');
const q2 = engine.createSubQuery('分析项目进展');

// 并行执行
await engine.executeParallel([q1.id, q2.id]);

// 检查预算
const decision = engine.checkBudget(10000);
if (decision.action === 'stop') {
  console.log('预算耗尽，停止查询');
}
```

## Stats

- enginesCreated: 创建的引擎数
- totalQueries: 总查询数
- totalTokens: 总 Token 使用

## 文件

- `impl/utils/query-engine-service.ts`