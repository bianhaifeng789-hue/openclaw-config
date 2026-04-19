---
name: mcp-official-registry-service
description: "MCP官方注册表服务。管理官方MCP服务器列表。Use when checking official MCP servers."
---

# MCP Official Registry Service

## 功能

管理官方MCP服务器列表。

### 官方服务器

- filesystem
- github
- postgres
- slack

### 示例

```javascript
const registry = getOfficialRegistry();

// 返回
{
  servers: [
    { name: 'filesystem', version: '1.0.0', url: '...' }
  ]
}
```

---

来源: Claude Code services/mcp/officialRegistry.ts