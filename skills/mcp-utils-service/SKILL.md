---
name: mcp-utils-service
description: "MCP工具服务。提供MCP相关的辅助工具函数集合，简化MCP操作。Use when using MCP utility functions."
---

# MCP Utils Service

## 功能

MCP工具函数集合。

### 核心工具

- mcpFormat - 格式化工具调用
- mcpValidate - 验证配置有效性
- mcpTransform - 转换数据格式
- mcpNormalize - 标准化请求格式

### 使用示例

```javascript
// 格式化请求
const request = mcpFormat({
  tool: 'read',
  params: { path: '/tmp' }
});

// 验证配置
const valid = mcpValidate(serverConfig);

// 转换响应
const result = mcpTransform(response);
```

### 常用场景

- MCP请求构建
- 配置验证
- 数据标准化
- 错误处理

---

来源: Claude Code services/mcp/utils.ts