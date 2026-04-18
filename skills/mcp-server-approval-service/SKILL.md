---
name: mcp-server-approval-service
description: "MCP服务器审批服务。管理用户对MCP服务器的审批流程。Use when approving MCP server access."
---

# MCP Server Approval Service

## 功能

管理MCP服务器审批。

### 审批流程

1. 请求审批
2. 用户确认
3. 记录决策

### 示例

```javascript
requestApproval({
  serverName: 'filesystem',
  action: 'read',
  path: '/etc/passwd'
});

// 用户确认后
approveRequest(requestId, true);
```

---

来源: Claude Code services/mcp/serverApproval.ts