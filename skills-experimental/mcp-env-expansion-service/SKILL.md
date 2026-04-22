---
name: mcp-env-expansion-service
description: "MCP环境变量扩展服务。解析环境变量配置，支持变量替换。Use when parsing MCP environment variables."
---

# MCP Env Expansion Service

## 功能

解析环境变量。

### 支持格式

- ${VAR_NAME}
- $VAR_NAME
- 默认值 ${VAR:default}

### 示例

```javascript
const expanded = expandEnv({
  apiKey: '${MCP_API_KEY}',
  url: '${MCP_URL:http://localhost}'
});

// 返回
{
  apiKey: '<redacted>',
  url: 'http://localhost' // 如果MCP_URL未设置
}
```

---

来源: Claude Code services/mcp/envExpansion.ts