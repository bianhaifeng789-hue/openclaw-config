---
name: types-plugin-definition
description: "插件类型定义。定义插件接口和类型规范。Use when defining plugin types and interfaces."
---

# Types Plugin Definition

## 功能

定义插件类型。

### 插件接口

- name
- version
- capabilities
- hooks

### 示例

```typescript
interface Plugin {
  name: string;
  version: string;
  capabilities: string[];
  hooks?: PluginHooks[];
}
```

---

来源: Claude Code types/plugin.ts