---
name: guardrails
description: "Pre-tool-call authorization for security (borrowed from DeerFlow) Use when [guardrails] is needed."
---

# Guardrails - 工具调用授权

**来源**: DeerFlow Guardrails Middleware

## 核心概念

### Pre-tool-call Authorization

**用途**: 工具执行前检查是否允许，防止危险操作

**机制**:
- Policy-driven authorization (ALLOW/DENY)
- DENY返回错误消息给Agent → Agent自适应

### 关键参数

- `denied_tools`: 禁止的工具列表
- `allowed_tools`: 白名单工具（优先级高于denied）
- `blocked_patterns`: 禁止的命令模式

## 实现

**脚本**: `impl/bin/guardrails-provider.js`

**状态文件**: `state/guardrails-config.json`

## 使用方法

### 评估工具调用

```bash
node impl/bin/guardrails-provider.js evaluate exec "rm -rf /"
# Result: { allow: false, reason: "Command contains blocked pattern: 'rm -rf'" }
```

### 配置管理

```bash
# 查看配置
node impl/bin/guardrails-provider.js config

# 禁止工具
node impl/bin/guardrails-provider.js deny-tool bash

# 添加白名单
node impl/bin/guardrails-provider.js allow-tool read

# 添加禁止模式
node impl/bin/guardrails-provider.js add-pattern "curl | bash"
```

## 默认禁止模式

```json
[
  "rm -rf",
  "sudo",
  "chmod 777",
  "curl | sh",
  "mkfs",
  "dd if="
]
```

## 默认危险路径

```json
[
  "/etc/",
  "/var/",
  "/usr/",
  "/bin/",
  "/sbin/",
  ".ssh/",
  ".env"
]
```

## 借鉴要点

### DeerFlow Guardrails特点

1. **AllowlistProvider（零依赖）**
   - 最简单，内置
   - 按工具名阻止或允许

2. **OAP Passport Provider（政策驱动）**
   - Open Agent Passport标准
   - 动态政策更新

3. **Custom Provider（自定义）**
   - 任何实现evaluate/aevaluate的类

4. **Fail-closed（默认拒绝）**
   - Provider错误时阻止调用

## 与OpenClaw集成

### Hooks系统（PreToolUse）

```yaml
hooks:
  PreToolUse:
    - command: "node impl/bin/guardrails-provider.js evaluate {tool_name} {tool_input}"
      onError: "return error to agent"
```

---

_创建时间: 2026-04-15_