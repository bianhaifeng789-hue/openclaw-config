---
name: mcp-string-utils-service
description: "MCP字符串工具服务。处理MCP协议中的字符串操作、格式化和验证。Use when manipulating MCP protocol strings."
---

# MCP String Utils Service

## 功能

MCP字符串工具函数。

### 核心功能

- formatMCPString - 格式化MCP字符串
- validateMCPString - 验证字符串格式
- parseMCPString - 解析MCP字符串
- escapeMCPString - 转义特殊字符

### 使用示例

```javascript
// 格式化工具调用
const formatted = formatMCPString('read_file', {
  path: '/tmp/file.txt',
  encoding: 'utf8'
});
// 返回: 'read_file:path=/tmp/file.txt,encoding=utf8'

// 验证字符串
const valid = validateMCPString(formatted);
// 返回: true/false
```

### 特殊处理

- 路径编码
- 参数序列化
- 空格处理
- 特殊字符转义

---

来源: Claude Code services/mcp/stringUtils.ts