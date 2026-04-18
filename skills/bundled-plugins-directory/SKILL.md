---
name: bundled-plugins-directory
description: "捆绑插件目录管理。管理内置插件列表，自动加载核心插件。Use when managing built-in OpenClaw plugins."
---

# Bundled Plugins Directory

## 功能

管理内置插件目录。

### 内置插件列表

- feishu - 飞书集成
- browser - 浏览器控制
- device-pair - 设备配对
- phone-control - 手机控制
- talk-voice - 语音通话
- acpx - ACP harness

### 加载机制

```javascript
// 自动加载内置插件
const bundledPlugins = [
  'feishu', 'browser', 'device-pair',
  'phone-control', 'talk-voice', 'acpx'
];

for (const plugin of bundledPlugins) {
  registerPlugin(plugin);
}
```

---

来源: Claude Code plugins/bundled/