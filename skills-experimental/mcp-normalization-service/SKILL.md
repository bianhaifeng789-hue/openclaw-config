---
name: mcp-normalization-service
description: "MCP服务器规范化服务。统一不同MCP服务器的API接口，标准化工具调用格式。Use when integrating MCP servers with different APIs."
---

# MCP Normalization Service

## 功能

统一MCP服务器API接口。

### 核心功能

- 工具名称标准化
- 参数格式统一
- 错误处理规范化
- 响应格式统一

### 示例

```javascript
// 不同MCP服务器返回格式不同
// normalization统一为标准格式

const normalizedTool = {
  name: 'read_file', // 标准化名称
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' }
    }
  },
  outputSchema: {
    type: 'object',
    properties: {
      content: { type: 'string' }
    }
  }
};
```

---

来源: Claude Code services/mcp/normalization.ts