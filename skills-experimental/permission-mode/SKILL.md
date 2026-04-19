---
name: permission-mode
description: "Control execution permissions with plan mode, auto mode, and user approval. Use when: sensitive operations, destructive changes, multi-step tasks that need user confirmation via Feishu cards."
metadata:
  openclaw:
    emoji: "🔒"
    triggers: [sensitive-operation, manual]
    feishuCard: true
---

# Permission Mode Skill - 权限模式切换

控制执行权限，敏感操作需要飞书卡片用户确认。

## 为什么需要这个？

**场景**：
- 删除文件操作
- 执行危险命令
- 发送外部消息
- 多步骤复杂任务

**问题**：
- Agent 直接执行可能造成不可逆后果
- 用户需要确认才能放心

**解决**：飞书卡片审批机制

---

## 权限模式

### 模式类型

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `auto` | 自动执行（默认） | 普通操作，信任用户 |
| `plan` | 计划模式 | 先展示计划，确认后执行 |
| `confirm` | 确认模式 | 每个敏感操作都要确认 |
| `restricted` | 受限模式 | 只允许安全操作 |

### 用户权限级别

| 级别 | 说明 | 权限 |
|------|------|------|
| `admin` | 管理员 | 所有操作 + plan mode |
| `trusted` | 信任用户 | auto + confirm |
| `normal` | 普通用户 | auto（受限） |
| `guest` | 访客 | restricted |

---

## Plan Mode（计划模式）

### 工作流程

```
用户：帮我重构认证系统

Agent:
1. 进入 Plan Mode
2. 发送飞书卡片："🔒 进入计划模式"
3. 探索代码库（Glob, Grep, Read）
4. 分析现有架构
5. 设计实现方案
6. 发送飞书卡片展示计划
7. 等待用户确认
8. 用户确认后执行
```

### 飞书卡片格式

**计划展示卡片**：

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔒 实现计划**\n\n**目标**：重构认证系统\n\n**步骤**：\n1. 分析现有认证模块\n2. 设计新的认证架构\n3. 创建认证服务\n4. 更新 API endpoints\n5. 添加测试\n\n**预计耗时**：30 分钟\n\n**影响文件**：\n• src/auth/\n• src/api/auth.ts\n• tests/auth/"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "✅ 确认执行"},
          "type": "primary",
          "value": {"action": "approve_plan", "planId": "xxx"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "❌ 拒绝"},
          "type": "default",
          "value": {"action": "reject_plan", "planId": "xxx"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "修改计划"},
          "type": "default",
          "value": {"action": "modify_plan", "planId": "xxx"}
        }
      ]
    }
  ]
}
```

---

## Confirm Mode（确认模式）

### 敏感操作检测

**需要确认的操作**：

| 类型 | 操作 | 风险级别 |
|------|------|----------|
| **文件删除** | `rm`, `trash` | 🔴 高 |
| **系统命令** | `sudo`, `chmod` | 🔴 高 |
| **外部发送** | 邮件、消息 | 🟡 中 |
| **配置修改** | settings, config | 🟡 中 |
| **数据操作** | 数据库写入 | 🟡 中 |
| **文件编辑** | 大范围修改 | 🟢 低 |

### 确认卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚠️ 需要确认**\n\n**操作**：删除文件\n**目标**：`~/project/old-module/`\n**风险**：🔴 高风险（不可逆）\n\n**说明**：此操作将删除整个 old-module 目录及其所有内容。\n\n**建议**：建议先备份或移到 trash 而非直接删除。"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "✅ 确认执行"},
          "type": "primary",
          "value": {"action": "approve", "operationId": "xxx"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "❌ 取消"},
          "type": "default",
          "value": {"action": "cancel", "operationId": "xxx"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "改用 trash"},
          "type": "default",
          "value": {"action": "suggest_trash", "operationId": "xxx"}
        }
      ]
    }
  ]
}
```

---

## 执行流程

### Plan Mode 流程

```
1. 用户请求复杂任务
2. Agent 检测需要 Plan Mode
3. 进入 Plan Mode
4. 发送飞书卡片："🔒 进入计划模式"
5. 探索代码库
6. 分析设计
7. 发送计划卡片（带确认按钮）
8. 等待用户响应
9. 用户点击按钮
10. 解析按钮 action
11. 执行或修改计划
```

### Confirm Mode 流程

```
1. Agent 准备执行敏感操作
2. 检测操作风险级别
3. 如果高风险 → 发送确认卡片
4. 等待用户响应
5. 用户确认 → 执行
6. 用户拒绝 → 跳过，建议替代方案
```

---

## 飞书按钮响应处理

### 按钮回调

飞书交互卡片按钮点击会触发回调：

```typescript
interface FeishuCardAction {
  action: 'approve' | 'cancel' | 'modify' | 'suggest_trash'
  planId?: string
  operationId?: string
}
```

### 处理逻辑

```
approve:
  → 标记为已确认
  → 执行操作

cancel:
  → 取消操作
  → 发送取消通知

modify:
  → 询问用户如何修改
  → 更新计划
  → 重新发送

suggest_trash:
  → 改用 trash 命令
  → 更安全执行
```

---

## 持久化存储

```json
// memory/permission-state.json
{
  "mode": "auto",
  "userLevel": "trusted",
  "pendingApprovals": [
    {
      "id": "xxx",
      "type": "plan",
      "description": "重构认证系统",
      "status": "pending",
      "createdAt": "2026-04-11T23:00:00Z",
      "expiresAt": "2026-04-11T23:30:00Z"
    }
  ],
  "approvedOperations": [
    {
      "id": "yyy",
      "type": "delete",
      "description": "删除 old-module",
      "approvedAt": "2026-04-11T22:00:00Z",
      "approvedBy": "ou_abc"
    }
  ],
  "permissionRules": {
    "alwaysAllow": ["read", "search", "analyze"],
    "alwaysConfirm": ["delete", "send", "system"],
    "alwaysDeny": []
  }
}
```

---

## 权限规则

### 规则类型

```typescript
interface PermissionRules {
  alwaysAllow: string[]    // 总是允许
  alwaysConfirm: string[]  // 总是需要确认
  alwaysDeny: string[]     // 总是拒绝
}
```

### 默认规则

```json
{
  "alwaysAllow": [
    "read_file",
    "search",
    "analyze",
    "list"
  ],
  "alwaysConfirm": [
    "delete_file",
    "execute_shell",
    "send_message",
    "modify_config"
  ],
  "alwaysDeny": [
    "delete_critical",
    "execute_sudo",
    "access_private"
  ]
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| Ink 确认对话框 | 飞书交互卡片 |
| Plan Mode 内置工具 | Skill + 飞书卡片 |
| AppState 权限管理 | permission-state.json |
| 终端键盘确认 | 飞书按钮点击 |

---

## 使用示例

### 示例 1：复杂任务计划

```
用户：帮我重构整个认证系统

Agent:
→ 检测为复杂任务
→ 发送飞书卡片：

🔒 进入计划模式

我将：
1. 探索现有认证模块
2. 分析架构
3. 设计重构方案
4. 展示计划给你确认

[开始探索]

→ 探索代码
→ 发送计划卡片（带确认按钮）
→ 等待用户响应
```

### 示例 2：敏感操作确认

```
用户：删除 old-module 目录

Agent:
→ 检测为高风险操作
→ 发送飞书卡片：

⚠️ 需要确认

操作：删除文件
目标：~/project/old-module/
风险：🔴 高风险

建议改用 trash 命令更安全。

[确认执行] [取消] [改用 trash]

→ 用户点击"改用 trash"
→ 执行 trash 命令
```

### 示例 3：权限级别

```
用户（管理员）：删除这个文件

Agent:
→ 检测用户级别 = admin
→ admin 可以直接执行（无需确认）
→ 执行删除

用户（普通用户）：删除这个文件

Agent:
→ 检测用户级别 = normal
→ 需要确认
→ 发送确认卡片
```

---

## 配置

```yaml
permissionMode:
  defaultMode: auto         # 默认模式
  defaultLevel: trusted     # 默认用户级别
  confirmTimeout: 1800      # 确认超时（秒）
  maxPendingApprovals: 10   # 最大待确认数
  approvalExpiration: 1800  # 确认过期时间（秒）
  sensitiveOperations:
    high: [delete, execute, send]
    medium: [modify_config, database_write]
    low: [edit_file]
```

---

## 注意事项

1. **确认超时**：长时间未确认自动取消
2. **权限继承**：管理员可以修改其他用户权限
3. **审计日志**：记录所有确认操作
4. **安全优先**：默认保守，宁可多确认
5. **用户友好**：提供替代方案（如 trash）

---

## 自动启用

此 Skill 在敏感操作时自动触发，复杂任务自动进入 Plan Mode。

---

## 下一步增强

- 飞书卡片回调处理（需要 API 支持）
- 权限继承机制
- 操作审计日志
- 批量确认（多个操作一次性确认）