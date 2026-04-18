---
name: mcp-service-complete
description: "MCP服务完整性。验证MCP服务整体配置完整性。Use when checking overall MCP service completeness."
---

# MCP Service Complete

## 功能

验证MCP完整性。

### 检查项

- servers配置
- tools可用性
- permissions设置

### 示例

```javascript
checkMCPComplete();

// 返回
{
  servers: ✅,
  tools: ✅,
  permissions: ✅
}
```

---

来源: Claude Code services/mcp.ts