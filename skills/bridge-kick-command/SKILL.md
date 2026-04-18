# Bridge Kick Command Skill

Bridge调试命令 - Ant-only + 故障注入 + Recovery测试。

## 功能概述

从Claude Code的bridge-kick.ts提取的bridge调试模式，用于OpenClaw的远程控制故障测试。

## 核心机制

### Ant-only限制

```typescript
isEnabled: () => process.env.USER_TYPE === 'ant'
// 只有Ant（内部）用户可用
// 生产环境不显示
```

### 故障注入

```typescript
// WebSocket close
h.fireClose(code)  // 1002, 1006等

// Poll failure
h.injectFault({ method: 'pollForWork', kind: 'fatal', status: 404 })

// Register failure
h.injectFault({ method: 'registerBridgeEnvironment', kind: 'transient' })

// Heartbeat failure
h.injectFault({ method: 'heartbeatWork', kind: 'fatal', status: 401 })
```

### Composite Sequences

```
# 复合故障模式
/bridge-kick register fail 2
/bridge-kick close 1002
→ expect: doReconnect tries register, fails → teardown
```

### Recovery验证

```
Workflow: connect Remote Control, run subcommand, `tail -f debug.log`
// 观察recovery reaction
```

## 实现建议

### OpenClaw适配

1. **ant-only**: 内部调试命令
2. **fault injection**: 故障注入框架
3. **recovery test**: 验证恢复路径

### 状态文件示例

```json
{
  "userType": "ant",
  "faults": {
    "close": { "code": 1002 },
    "poll": { "status": 404, "errorType": "not_found_error" }
  }
}
```

## 关键模式

### Fault Injection API

```
h.injectFault({ method, kind, status, errorType, count })
// 统一的故障注入接口
// 支持transient和fatal两种类型
```

### Recovery Testing

```
注入故障 → 触发事件 → 观察debug.log → 验证recovery
// 完整的故障测试流程
```

## 借用价值

- ⭐⭐⭐⭐ Fault injection框架
- ⭐⭐⭐⭐ Composite sequence测试
- ⭐⭐⭐ Recovery验证流程

## 来源

- Claude Code: `commands/bridge-kick.ts`
- 分析报告: P37-1