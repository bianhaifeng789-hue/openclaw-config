---
name: analytics-telemetry
description: "Analytics & Telemetry - Session tracing, event logging, and analytics reporting. Performance monitoring and usage statistics. Use when tracking session events, monitoring performance, or reporting usage statistics."
metadata:
  openclaw:
    emoji: "📊"
    triggers: [session-start, session-end, tool-call, api-call]
    priority: medium
    imports:
      - impl/utils/session-tracing.ts
      - impl/utils/analytics-service.ts
---

# Analytics & Telemetry Skill

会话追踪和分析系统 - 监控性能和统计使用数据。

## 为什么需要

**问题**：
- OpenClaw 缺少详细的会话追踪
- 无法分析用户行为模式
- 缺少性能监控数据
- 无法优化 token 使用

**解决**：
- 借鉴 Claude Code 的 telemetry 系统
- 会话追踪（完整追踪链）
- 事件日志（所有关键事件）
- Perfetto 格式导出（性能分析）

---

## 核心模块

### 1. Session Tracing (会话追踪)

追踪会话的全生命周期：

| 事件类型 | 说明 |
|---------|-----|
| `session_start` | 会话开始 |
| `session_end` | 会话结束 |
| `message_sent` | 发送消息 |
| `tool_call` | 工具调用 |
| `api_request` | API 请求 |
| `cache_hit` | Cache 命中 |
| `compact` | 上下文压缩 |
| `fork_agent` | Forked agent |

### 2. Analytics Service (分析服务)

记录和分析关键事件：

| 分析指标 | 说明 |
|---------|-----|
| 总会话数 | 统计活跃度 |
| 平均时长 | 用户参与度 |
| 工具调用次数 | 功能使用 |
| API 调用统计 | Token 使用 |
| Cache 命中率 | 效率指标 |
| 错误率 | 系统稳定性 |

---

## 使用方式

### 1. 开始会话追踪

```typescript
import { sessionTracing, analyticsService } from './analytics-telemetry'

// 开始追踪
sessionTracing.startSessionTrace(
  'session-123',
  'feishu_message',
  'feishu',
  'ou_xxx'
)

// 记录分析事件
analyticsService.logSessionStart('session-123', 'feishu', 'ou_xxx')
```

### 2. 记录事件

```typescript
// 记录工具调用
sessionTracing.recordToolCall('read', true, 150)
analyticsService.logToolUsage('read', true, 150, 'session-123')

// 记录 API 调用
sessionTracing.recordApiRequest(
  'claude-sonnet-4',
  5000,   // input
  1000,   // output
  3000,   // cache read
  0,      // cache create
  2500    // latency
)

analyticsService.logApiCall('claude-sonnet-4', 5000, 1000, 2500, true)
```

### 3. 结束追踪

```typescript
// 结束追踪
const trace = sessionTracing.endSessionTrace('session-123')

// 记录分析
analyticsService.logSessionEnd(
  'session-123',
  trace.totalDurationMs,
  trace.events.length,
  trace.toolStats?.callCount ?? 0,
  trace.apiStats?.totalTokens ?? 0
)
```

### 4. 生成报告

```typescript
import { analyticsService } from './analytics-service'

// 生成报告（最近24小时）
const report = analyticsService.generateAnalyticsReport(
  Date.now() - 24 * 60 * 60 * 1000,
  Date.now()
)

console.log('总会话:', report.summary.totalSessions)
console.log('平均时长:', report.summary.avgSessionDurationMs)
console.log('Cache命中率:', report.summary.cacheHitRate)
console.log('常用工具:', report.topTools)
```

---

## 追踪链机制

借鉴 Claude Code 的 forked agent tracing：

```typescript
// 父会话
const parentChain = sessionTracing.startTraceChain('session-123')

// Forked agent（子链）
const childChain = sessionTracing.createChildChain('session-123')
// depth = 1

// 在子链中记录事件
sessionTracing.recordTraceEvent('memory_extract', 'Extracting memories')

// 结束子链
sessionTracing.endTraceChain()

// 回到父链
// depth = 0
```

---

## Perfetto 格式导出

用于性能分析工具：

```typescript
import { sessionTracing } from './session-tracing'

const trace = sessionTracing.getSessionTrace('session-123')
const perfettoEvents = sessionTracing.exportToPerfetto(trace)

// 保存为 JSON
// 可以导入到 Perfetto UI 分析
```

Perfetto 格式：
```json
[
  {
    "name": "Tool: read",
    "ts": 1703275200000000,
    "dur": 150000,
    "pid": 1,
    "tid": 1,
    "ph": "X",
    "cat": "tool_result",
    "args": { "toolName": "read", "success": true }
  }
]
```

---

## 借鉴 Claude Code

| Claude Code | OpenClaw |
|-------------|----------|
| `telemetry/sessionTracing.ts` | `session-tracing.ts` |
| `telemetry/perfettoTracing.ts` | `exportToPerfetto()` |
| `analytics/events.ts` | `analytics-service.ts` |
| `analytics/logger.ts` | `logAnalyticsEvent()` |

---

## 统计摘要

```typescript
import { sessionTracing } from './session-tracing'

const summary = sessionTracing.getTracingSummary()

console.log('总会话:', summary.totalSessions)
console.log('总事件:', summary.totalEvents)
console.log('平均API延迟:', summary.avgApiLatencyMs)
console.log('平均工具时长:', summary.avgToolDurationMs)
console.log('总Token:', summary.totalTokensUsed)
console.log('Cache节省:', summary.tokensSavedByCache)
```

---

## 飞书整合

与飞书心跳整合：

```typescript
// 在 heartbeat 中收集统计
const report = analyticsService.generateAnalyticsReport(
  heartbeatState.lastCheck,
  Date.now()
)

// 如果有异常，发送飞书卡片
if (report.summary.errorRate > 0.1) {
  await message({
    action: 'send',
    card: {
      type: 'template',
      data: {
        template_id: 'blue_card',
        template_variable: {
          title: '⚠️ 错误率警告',
          content: `错误率: ${(report.summary.errorRate * 100).toFixed(1)}%`
        }
      }
    }
  })
}
```

---

## 配置

```yaml
analyticsTelemetry:
  enabled: true
  maxEvents: 5000       # 最大事件数
  autoSaveInterval: 1h  # 自动保存间隔
  perfettoExport: false # 是否导出 Perfetto
  logLevel: 'info'      # 日志级别
```

---

## 状态文件

```json
{
  "totalSessions": 25,
  "totalEvents": 500,
  "eventCounts": {
    "session_start": 25,
    "tool_used": 120,
    "api_call": 80
  },
  "summary": {
    "avgSessionDurationMs": 300000,
    "avgApiLatencyMs": 2500,
    "cacheHitRate": 0.45
  }
}
```

---

## 注意事项

1. **隐私保护**：不记录敏感内容
2. **性能影响**：追踪应该轻量级
3. **存储限制**：定期清理旧数据
4. **错误处理**：追踪失败不应影响主流程

---

## 代码位置

- `impl/utils/session-tracing.ts` - 会话追踪
- `impl/utils/analytics-service.ts` - 分析服务
- `memory/analytics-state.json` - 状态文件

---

## 参考资料

- Claude Code: `src/telemetry/sessionTracing.ts`
- Claude Code: `src/telemetry/perfettoTracing.ts`
- Claude Code: `src/analytics/events.ts`
- Perfetto: https://perfetto.dev/