---
name: lsp-service-complete
description: "LSP服务完整性检查。验证语言服务器协议配置完整性，确保代码分析功能正常。Use when checking LSP server configuration completeness."
---

# LSP Service Complete

## 功能

验证LSP配置完整性。

### 检查项

- serverPath - 服务器路径
- languageId - 语言标识
- initializationOptions - 初始化选项
- capabilities - 功能列表

### 示例

```javascript
validateLSP({
  language: 'typescript',
  server: 'typescript-language-server',
  capabilities: ['completion', 'diagnostics']
});

// 返回: ✅ LSP配置完整
```

---

来源: Claude Code services/lsp.ts