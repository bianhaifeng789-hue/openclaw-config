---
name: mcp-channel-permissions-service
description: "MCP通道权限服务。管理用户对不同通道的访问权限。Use when checking channel access permissions."
---

# MCP Channel Permissions Service

## 功能

管理通道权限。

### 权限级别

- read - 只读
- write - 发送消息
- admin - 管理权限

### 示例

```javascript
const permission = checkChannelPermission(userId, 'feishu');

// 返回
{
  level: 'write',
  allowedActions: ['send', 'react'],
  restricted: ['admin', 'delete']
}
```

---

来源: Claude Code services/mcp/channelPermissions.ts