---
name: mcp-tools-complete
description: "MCP工具完整性服务。验证MCP工具定义完整性。Use when checking MCP tool completeness."
---

# MCP Tools Complete Service

## 功能

验证工具完整性。

### 检查项

- name
- inputSchema
- outputSchema
- handler

### 示例

```javascript
validateTool({
  name: 'read',
  inputSchema: { ... },
  handler: () => {}
});

// 返回: ✅ 工具定义完整
```

---

来源: Claude Code services/mcp/toolsComplete.ts