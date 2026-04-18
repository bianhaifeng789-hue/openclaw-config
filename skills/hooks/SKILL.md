---
name: hooks
description: "Lifecycle hooks system for custom shell commands at various points. Execute user-defined hooks at PreToolUse, PostToolUse, Notification, Stop events. Use when [hooks] is needed."
metadata:
  openclaw:
    emoji: "🪝"
    triggers: [lifecycle-event]
    feishuCard: true
---

# Hooks Skill - 生命周期钩子系统

在各种生命周期事件时执行用户自定义的 shell 命令。

## 为什么需要这个？

**场景**：
- 工具执行前检查（PreToolUse）
- 工具执行后处理（PostToolUse）
- 通知发送时（Notification）
- 会话停止时（Stop）

**Claude Code 方案**：hooks.ts（5000+行）+ 多种 HookEvent
**OpenClaw 飞书适配**：简化版 + 飞书卡片通知

---

## Hook Events

| Event | 触发时机 | 用途 |
|-------|----------|------|
| **PreToolUse** | 工具执行前 | 检查、拦截、准备 |
| **PostToolUse** | 工具执行后 | 后处理、记录、通知 |
| **Notification** | 通知发送时 | 自定义通知 |
| **Stop** | 会话停止时 | 清理、保存、报告 |
| **PrePrompt** | 提示发送前 | 修改提示内容 |
| **PostPrompt** | 提示发送后 | 记录提示历史 |

---

## Hook 配置

```json
// hooks-config.json
{
  "hooks": [
    {
      "event": "PreToolUse",
      "matcher": {
        "toolName": "BashTool"
      },
      "command": "./scripts/check-command.sh",
      "timeout": 5000
    },
    {
      "event": "PostToolUse",
      "matcher": {
        "toolName": "FileEditTool"
      },
      "command": "./scripts/record-edit.sh",
      "timeout": 10000
    },
    {
      "event": "Notification",
      "command": "./scripts/custom-notify.sh",
      "timeout": 3000
    },
    {
      "event": "Stop",
      "command": "./scripts/session-cleanup.sh",
      "timeout": 30000
    }
  ]
}
```

---

## Hook Input/Output

### Input

```typescript
interface HookInput {
  event: HookEvent
  toolName?: string
  toolInput?: object
  toolResult?: object
  message?: string
  timestamp: Date
  sessionId: string
}
```

### Output

```typescript
interface HookOutput {
  // 同步输出（直接返回）
  status: 'success' | 'error' | 'blocked'
  message?: string
  modifiedInput?: object  // PreToolUse 可修改输入
  
  // 异步输出（JSON 格式）
  prompt?: string         // PrePrompt 可修改提示
  permission?: 'allow' | 'deny' | 'ask'
  notification?: {
    title: string
    message: string
  }
}
```

---

## 飞书卡片格式

### Hook 执行卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🪝 Hook 已执行**\n\n**事件**：PreToolUse\n**工具**：BashTool\n**命令**：./scripts/check-command.sh\n\n**结果**：✅ 成功\n**耗时**：125ms\n\n**输出**：\n命令检查通过，允许执行。"
      }
    }
  ]
}
```

### Hook 拦截卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🪝 Hook 拦截**\n\n**事件**：PreToolUse\n**工具**：BashTool\n**命令**：rm -rf /\n\n**结果**：❌ 阻止\n**理由**：危险命令，禁止执行\n\n**建议**：使用 trash 命令替代。"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 加载 Hook 配置

```
Startup:
1. 读取 hooks-config.json
2. 解析 hooks 数组
3. 按事件类型分组
4. 注册到 hookRegistry
```

### 2. 触发 Hook

```
Lifecycle Event:
1. 检查是否有匹配的 hook
2. 构造 HookInput
3. 执行 shell 命令（spawn child process）
4. 等待输出（timeout 限制）
5. 解析 HookOutput
6. 根据输出执行后续操作：
   - success: 继续
   - blocked: 拦截，返回错误
   - modifiedInput: 使用修改后的输入
```

### 3. Shell 命令执行

```typescript
function executeHook(command: string, input: HookInput): Promise<HookOutput> {
  const child = spawn(command, {
    env: {
      ...process.env,
      HOOK_EVENT: input.event,
      HOOK_TOOL_NAME: input.toolName,
      HOOK_SESSION_ID: input.sessionId,
      HOOK_INPUT: JSON.stringify(input.toolInput)
    }
  })
  
  // 等待输出，超时则终止
  const output = await waitForOutput(child, timeout)
  
  // 解析 JSON 输出
  if (isJSON(output)) {
    return JSON.parse(output)
  }
  
  // 同步输出
  return { status: 'success', message: output }
}
```

---

## Matcher 匹配规则

```typescript
interface HookMatcher {
  toolName?: string | string[]  // 工具名匹配
  toolInput?: object            // 输入匹配
  messagePattern?: RegExp       // 消息模式
}
```

**示例**：
```json
{
  "matcher": {
    "toolName": ["BashTool", "FileEditTool"],
    "toolInput": {
      "command": "rm*"
    }
  }
}
```

---

## 持久化存储

```json
// memory/hooks-state.json
{
  "hooksRegistered": [
    {
      "event": "PreToolUse",
      "matcher": {"toolName": "BashTool"},
      "command": "./scripts/check-command.sh",
      "enabled": true
    }
  ],
  "hooksExecuted": [
    {
      "hookId": "hook-1",
      "event": "PreToolUse",
      "toolName": "BashTool",
      "status": "success",
      "timestamp": "2026-04-11T23:30:00Z",
      "duration": 125
    }
  ],
  "stats": {
    "hooksExecuted": 0,
    "hooksBlocked": 0,
    "hooksFailed": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| hooks.ts（5000+行） | 简化版 Skill |
| HookInput/Output 复杂类型 | 简化 JSON |
| 多种 Matcher 类型 | 工具名/输入匹配 |
| Shell + PowerShell | Shell 命令 |
| 终端通知 | 飞书卡片 |
| PermissionRequestResult | allow/deny/ask |

---

## 注意事项

1. **Timeout**：必须有超时限制，避免卡死
2. **Error Handling**：hook 失败不应中断主流程
3. **Security**：检查命令安全性，防止注入
4. **Concurrency**：hook 可以异步执行
5. **Logging**：记录所有 hook 执行历史

---

## 自动启用

此 Skill 在工具执行前后、通知发送、会话停止时自动触发。

---

## 下一步增强

- Hook 编辑界面（飞书卡片配置）
- Hook 测试工具
- Hook 调试日志
- Hook 性能监控