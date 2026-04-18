---
name: mcp-connection-manager-service
description: "MCP连接管理服务。管理MCP服务器连接生命周期，处理连接、断开、重连。Use when managing MCP server connections."
---

# MCP Connection Manager Service

## 功能

管理MCP服务器连接。

### 核心操作

- connect - 建立服务器连接
- disconnect - 断开现有连接
- reconnect - 重新连接服务器
- healthCheck - 检查连接健康

### 使用示例

```javascript
// 连接服务器
await connectMCP({
  server: 'filesystem',
  url: 'mcp://localhost/filesystem',
  timeout: 30000
});

// 断开连接
disconnectMCP('filesystem');

// 重连
reconnectMCP('filesystem');

// 健康检查
const health = checkConnectionHealth('filesystem');
```

### 连接状态

- connected - 已连接
- disconnected - 已断开
- reconnecting - 重连中
- error - 连接错误

---

来源: Claude Code services/mcp/connectionManager.ts