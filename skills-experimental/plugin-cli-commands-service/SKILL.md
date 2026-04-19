---
name: plugin-cli-commands-service
description: "插件CLI命令服务。提供插件管理的命令行接口，支持安装、列出、移除插件。Use when managing plugins via CLI."
---

# Plugin CLI Commands Service

## 功能

CLI插件管理命令。

### 核心命令

- plugin install - 安装新插件
- plugin list - 列出已安装插件
- plugin remove - 移除插件
- plugin update - 更新插件
- plugin search - 搜索插件

### 使用示例

```bash
# 安装插件
plugin install feishu-card-builder

# 列出插件
plugin list --all

# 移除插件
plugin remove old-plugin

# 更新插件
plugin update feishu-card-builder --latest
```

### 插件来源

- npm - NPM公共仓库
- github - GitHub仓库
- local - 本地目录

---

来源: Claude Code services/pluginCLI.ts