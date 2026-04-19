---
name: mcp-elicitation-handler-service
description: "MCP Elicitation处理服务。处理MCP服务器的请求/响应交互流程。Use when handling MCP elicitation requests."
---

# MCP Elicitation Handler Service

## 功能

处理MCP交互请求。

### 处理类型

- 请求验证 - 验证请求格式有效性
- 响应格式化 - 标准化响应格式
- 错误处理 - 统一错误返回格式
- 流程控制 - 管理请求响应流程

### 使用示例

```javascript
// 处理请求
const response = handleElicitation({
  requestId: 'req-001',
  type: 'permission',
  data: {
    action: 'read_file',
    path: '/etc/passwd'
  }
});

// 返回处理结果
{
  status: 'approved',
  requestId: 'req-001',
  permission: 'granted'
}
```

### 审批流程

- 权限请求 - 检查权限配置
- 资源访问 - 验证访问权限
- 工具调用 - 确认工具可用性

---

来源: Claude Code services/mcp/elicitationHandler.ts