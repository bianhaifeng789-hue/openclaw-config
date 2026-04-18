---
name: mcp-server-approval
description: "MCP server approval service for Feishu scenarios Use when [mcp server approval] is needed."
triggers:
  - mcp_server_approval
  - mcp_approval
  - server_approval
metadata:
  openclaw:
    source: claude-code-pattern
    category: security
    priority: high
---

# MCP Server Approval Service

借鉴 Claude Code mcpServerApproval.tsx，飞书场景用卡片实现审批交互。

## 核心功能

| 功能 | 说明 |
|------|------|
| needsApproval | 检查服务器是否需要审批 |
| requestApproval | 创建审批请求 |
| approveServer | 批准服务器 |
| denyServer | 拒绝服务器 |
| autoApproveSafe | 自动批准安全服务器 |
| generateApprovalCard | 飞书审批卡片 |

## 安全服务器（自动批准）

- filesystem
- memory
- brave-search
- github

## 危险能力（需要审批）

- code-execution
- shell-execution
- file-write
- network-access
- env-access

## 飞书卡片

审批卡片包含：
- 服务器名称、地址、请求原因
- 危险能力列表（红色标记）
- 安全能力列表（绿色标记）
- 批准/拒绝按钮

## 使用示例

```typescript
import { mcpServerApprovalService } from './mcp-server-approval.js'

// 检查是否需要审批
if (mcpServerApprovalService.needsApproval('my-server', ['code-execution'])) {
  // 创建审批请求
  const approval = mcpServerApprovalService.requestApproval(
    'server-001',
    'my-server',
    'https://example.com/mcp',
    ['code-execution', 'file-read'],
    '用户请求连接 MCP 服务器'
  )
  
  // 生成飞书审批卡片
  const card = mcpServerApprovalService.generateApprovalCard(approval)
  
  // 发送卡片到飞书
  message({ action: 'send', card })
}
```

## 来源

借鉴 Claude Code services/mcpServerApproval.tsx
适配飞书场景：用卡片替代 TUI Dialog