---
name: plugin-installation-manager-service
description: "插件安装管理器服务。管理插件安装、更新、卸载流程。Use when managing plugin installation lifecycle."
---

# Plugin Installation Manager Service

## 功能

管理插件安装。

### 操作类型

- install
- update
- uninstall
- list

### 示例

```javascript
installPlugin({
  name: 'my-plugin',
  source: 'npm',
  version: 'latest'
});
```

---

来源: Claude Code services/pluginInstallation.ts