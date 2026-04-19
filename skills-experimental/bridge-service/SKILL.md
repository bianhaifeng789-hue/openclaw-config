---
name: bridge-service
description: "Bridge Service - Remote collaboration system with connection management, session handling, messaging, permission callbacks, and capacity wake. Use when [bridge service] is needed."
metadata:
  openclaw:
    emoji: "🌉"
    triggers: [remote, cloud, bridge]
    priority: high
    imports:
      - impl/utils/bridge-service.ts
---

# Bridge Service Skill

远程协作桥接系统 - 借鉴 Claude Code 的 Bridge 架构。

## 核心功能

| 功能 | 说明 |
|-----|-----|
| Connection Management | 连接/断开/健康检查 |
| Session Management | 会话创建/恢复 |
| Messaging System | 消息发送/接收 |
| Permission Callbacks | 权限审批回调 |
| Capacity Wake | 容量唤醒/休眠 |

---

## 桥接模式

| 模式 | 说明 |
|-----|-----|
| `local` | 本地模式（无远程） |
| `remote` | 远程模式（SSH） |
| `cloud` | 云端模式（Claude.ai） |
| `hybrid` | 混合模式 |

---

## 使用方式

### 1. 连接桥接

```typescript
import { connectBridge, setBridgeConfig } from './bridge-service'

// 设置云端模式
setBridgeConfig({
  mode: 'cloud',
  authMethod: 'jwt',
  authCredentials: 'xxx'
})

// 连接
await connectBridge()
```

### 2. 创建会话

```typescript
import { createBridgeSession } from './bridge-service'

const session = createBridgeSession(
  'cloud',
  'ou_xxx',
  'device_xxx',
  'feishu'
)
```

### 3. 发送消息

```typescript
import { sendBridgeMessage } from './bridge-service'

const message = await sendBridgeMessage(
  { type: 'request', content: 'Hello' },
  'cloud',
  session.sessionId
)
```

---

## 连接状态

| 状态 | 说明 |
|-----|-----|
| `disconnected` | 未连接 |
| `connecting` | 正在连接 |
| `connected` | 已连接 |
| `reconnecting` | 正在重连 |
| `error` | 错误 |

---

## 借鉴 Claude Code

| Claude Code | OpenClaw |
|-------------|----------|
| `bridge/bridgeApi.ts` | `connectBridge()` |
| `bridge/bridgeMessaging.ts` | `sendBridgeMessage()` |
| `bridge/bridgePermissionCallbacks.ts` | `registerPermissionCallback()` |
| `bridge/capacityWake.ts` | `wakeCapacity()` |
| `bridge/reconnection.ts` | `startReconnection()` |

---

## 容量管理

```typescript
import { checkCapacity, wakeCapacity, sleepCapacity } from './bridge-service'

// 检查容量
const capacity = checkCapacity()
console.log('Available:', capacity.available)
console.log('Utilization:', capacity.utilization)

// 唤醒
wakeCapacity()

// 休眠（节省资源）
sleepCapacity()
```

---

## 代码位置

- `impl/utils/bridge-service.ts`