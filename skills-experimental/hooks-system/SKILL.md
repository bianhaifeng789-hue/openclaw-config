---
name: hooks-system
description: "Hooks System - Functional hooks adapted from Claude Code's React hooks. Includes permission checking, status management, inbox polling, typeahead, and more. Use when [hooks system] is needed."
metadata:
  openclaw:
    emoji: "🪝"
    triggers: [tool-call, status-change, message-poll]
    priority: medium
    imports:
      - impl/utils/hooks-system.ts
---

# Hooks System Skill

函数式 Hooks 系统 - 借鉴 Claude Code 的 React hooks。

## 核心 Hooks

| Hook | 功能 |
|------|-----|
| `canUseTool()` | 工具权限检查 |
| `setStatus()` | 状态管理 |
| `startInboxPoller()` | 收件箱轮询 |
| `afterFirstRender()` | 首次渲染后执行 |
| `matchTypeahead()` | 自动补全 |
| `cancelRequest()` | 取消请求 |
| `startBlink()` | 闪烁效果 |

---

## 使用方式

### 1. 权限检查

```typescript
import { canUseTool, setPermissionContext } from './hooks-system'

// 设置权限模式
setPermissionContext({ permissionMode: 'auto' })

// 检查工具权限
const result = canUseTool('read')
console.log(result.allowed)  // true
console.log(result.needsPrompt)  // false
```

### 2. 状态管理

```typescript
import { setStatus, subscribeStatus } from './hooks-system'

// 设置状态
setStatus('executing', 'Running tool', 'read')

// 订阅状态变更
const unsubscribe = subscribeStatus((status) => {
  console.log('Status:', status.status)
})

// 取消订阅
unsubscribe()
```

### 3. 收件箱轮询

```typescript
import { startInboxPoller, registerMessageHandler } from './hooks-system'

// 启动轮询（30秒间隔）
startInboxPoller(30000)

// 注册消息处理器
registerMessageHandler(async (messages) => {
  console.log('New messages:', messages.length)
})
```

---

## 权限模式

| 模式 | 说明 |
|-----|-----|
| `auto` | 所有工具自动允许 |
| `plan` | 只允许读取类工具 |
| `confirm` | 需要用户确认 |
| `restricted` | 只允许白名单工具 |

---

## 状态类型

| 状态 | 说明 |
|-----|-----|
| `idle` | 空闲 |
| `thinking` | 思考中 |
| `executing` | 执行工具 |
| `waiting_input` | 等待用户输入 |
| `compacting` | 压缩上下文 |
| `error` | 错误 |

---

## 借鉴 Claude Code

| Claude Code | OpenClaw |
|-------------|----------|
| `useCanUseTool` | `canUseTool()` |
| `useStatus` | `setStatus() + subscribeStatus()` |
| `useInboxPoller` | `startInboxPoller()` |
| `useAfterFirstRender` | `afterFirstRender()` |
| `useTypeahead` | `matchTypeahead()` |
| `useCancelRequest` | `cancelRequest()` |
| `useBlink` | `startBlink()` |
| `useVirtualScroll` | `calculateVirtualScroll()` |

---

## 代码位置

- `impl/utils/hooks-system.ts`