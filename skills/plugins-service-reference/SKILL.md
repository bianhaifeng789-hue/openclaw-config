---
name: plugins-service-reference
description: "插件服务参考文档。管理插件生命周期和加载机制。Use when managing plugin lifecycle."
---

# Plugins Service Reference

## 功能

管理插件。

### 插件生命周期

- register - 注册
- initialize - 初始化
- start - 启动
- stop - 停止

### 示例

```javascript
registerPlugin({
  name: 'my-plugin',
  version: '1.0.0',
  capabilities: ['read', 'write']
});
```

---

来源: Claude Code services/plugins.ts