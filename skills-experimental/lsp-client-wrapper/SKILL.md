# LSP Client Wrapper Skill

LSP进程管理 - JSON-RPC通信封装和生命周期管理。

## 功能概述

从Claude Code的LSPClient.ts提取的LSP服务器管理模式，用于OpenClaw的IDE集成。

## 核心机制

### Spawn等待（关键！）

```typescript
await new Promise<void>((resolve, reject) => {
  process.once('spawn', onSpawn)
  process.once('error', onError)
})
```

**重要**: spawn()返回后error事件异步触发，必须等待spawn事件确认进程启动成功。

### 连接生命周期

```
start(command, args) → initialize(params) → [操作] → stop()
```

#### start()
```typescript
spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] })
createMessageConnection(reader, writer)
connection.listen()
connection.trace(Trace.Verbose)
```

#### initialize()
```typescript
const result = await connection.sendRequest('initialize', params)
capabilities = result.capabilities
await connection.sendNotification('initialized', {})
isInitialized = true
```

#### stop()
```typescript
await connection.sendRequest('shutdown', {})
await connection.sendNotification('exit', {})
connection.dispose()
process.kill()
```

### 错误处理

#### Crash Callback
```typescript
createLSPClient(serverName, onCrash)
// 非零exit时通知owner重启
```

#### IsStopping Flag
```typescript
isStopping = true  // 防止spurious error logging
// 在close开始时设置
```

### Handler Queue（Lazy Initialization）

```typescript
pendingHandlers: Array<{ method, handler }>
pendingRequestHandlers: Array<{ method, handler }>

onNotification(method, handler):
  if (!connection) {
    pendingHandlers.push({ method, handler })
  } else {
    connection.onNotification(method, handler)
  }
```

连接ready后apply queued handlers。

### 协议追踪

```typescript
connection.trace(Trace.Verbose, {
  log: (message) => logForDebugging(`[LSP PROTOCOL] ${message}`)
})
```

## 实现建议

### OpenClaw适配

1. **场景**: IDE集成、语言服务器管理
2. **进程**: Bun.spawn或Node spawn
3. **通信**: vscode-jsonrpc或自定义
4. **清理**: registerCleanup注册清理函数

### 状态文件示例

```json
{
  "serverName": "typescript-language-server",
  "isInitialized": true,
  "capabilities": {
    "completionProvider": { "triggerCharacters": ["."] },
    "diagnosticsProvider": true
  },
  "crashCount": 0
}
```

## 关键模式

### Error Event Ordering

```
spawn → spawn event (成功)
spawn → error event (失败，如ENOENT)
```

必须在使用streams前确认spawn成功。

### Handler Registration Timing

可在connection前注册handlers，连接后自动apply。

### Stderr Capture

```typescript
process.stderr.on('data', (data) => {
  logForDebugging(`[LSP SERVER] ${data}`)
})
```

用于诊断服务器问题。

## 借用价值

- ⭐⭐⭐⭐ Spawn等待模式防race condition
- ⭐⭐⭐ Lazy handler registration
- ⭐⭐⭐ Crash propagation给owner决策

## 来源

- Claude Code: `services/lsp/LSPClient.ts`
- 分析报告: P33-5