---
name: mcp-config-service
description: "MCP配置管理服务。管理MCP服务器配置，自动加载和验证。Use when managing MCP server configurations."
---

# MCP Config Service

## 功能

管理MCP服务器配置。

### 配置项

- serverUrl
- apiKey
- capabilities
- timeout

### 示例

```javascript
const mcpConfig = {
  servers: [
    {
      name: 'filesystem',
      url: 'mcp://localhost/filesystem',
      capabilities: ['read', 'write']
    }
  ]
};
```

---

来源: Claude Code services/mcp/config.ts