---
name: team-memory-sync
description: "Sync team memory across Feishu group chats. Share memory files (MEMORY.md, patterns.md) with all group members automatically. Use when [team memory sync] is needed."
metadata:
  openclaw:
    emoji: "👥"
    triggers: [group-chat, manual]
    feishuCard: true
    requiresGroup: true
---

# Team Memory Sync Skill - 团队记忆同步

飞书群聊共享记忆，多用户协作时自动同步。

## 为什么需要这个？

**场景**：
- 飞书群聊多人协作
- 一个用户的信息应该被所有成员共享
- 例如：团队偏好、项目进展、重要决策

**Claude Code 方案**：基于 git repo + OAuth + 远程 API
**OpenClaw 飞书适配**：基于飞书群聊 ID + 飞书云文档

---

## 核心概念

### Team ID

飞书群聊 ID 作为团队标识：

```typescript
interface TeamIdentity {
  chatId: string        // 飞书群聊 ID
  chatName?: string     // 群聊名称
  members: string[]     // 成员 open_id 列表
}
```

### Team Memory Files

共享的记忆文件：

```
team-memory/
├── MEMORY.md          # 团队长期记忆
├── patterns.md        # 团队工作模式
├── decisions.md       # 重要决策记录
├── preferences.md     # 团队偏好
└── projects.md        # 项目进展
```

---

## 同步机制

### 方案 1：飞书云文档存储

```
┌─────────────────────────────────────────┐
│ 飞书云文档                               │
│ /team-memory/{chatId}/MEMORY.md         │
│ /team-memory/{chatId}/patterns.md       │
│ ...                                      │
└─────────────────────────────────────────┘
         ↑                    ↓
    Push (写入)           Pull (读取)
         ↑                    ↓
┌─────────────────────────────────────────┐
│ OpenClaw Agent                          │
│ - 本地 workspace/memory/                │
│ - 监控变化                               │
│ - 自动同步                               │
└─────────────────────────────────────────┘
```

**优点**：
- 飞书原生支持
- 多用户可见
- 版本历史

**缺点**：
- 需要云文档 API 支持

---

### 方案 2：飞书消息存储（简化）

```
群聊消息：
- "📝 团队记忆更新：新增决策 #123"
- "📝 团队记忆更新：项目进展同步"

Agent 收集消息 → 解析 → 合并到本地 memory
```

**优点**：
- 简单实现
- 不需要额外 API

**缺点**：
- 消息可能丢失
- 不适合大量数据

---

### 方案 3：混合方案（推荐）

```
- 小文件/频繁更新 → 飞书消息通知
- 大文件/历史记录 → 飞书云文档存储
- 实时同步 → 群聊卡片推送
```

---

## 飞书卡片格式

### 团队记忆更新卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**👥 团队记忆同步**\n\n📝 新增决策：采用 React 18\n📝 项目进展：记忆系统完成\n📝 团队偏好：简洁回复\n\n**同步到**：技术讨论群"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "查看团队记忆"},
          "type": "primary",
          "value": {"action": "view_team_memory"}
        }
      ]
    }
  ]
}
```

### 团队记忆查询卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**👥 团队记忆**\n\n**最近决策**：\n- 采用 React 18（2026-04-10）\n- 使用 TypeScript strict mode（2026-04-08）\n\n**项目进展**：\n- 记忆系统：完成\n- 认证模块：进行中\n\n**团队偏好**：\n- 简洁回复、自主决策"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "更新时间：2026-04-11 23:00"}
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 群聊识别

```
Agent:
1. 检测消息来自群聊（chat_type: "group"）
2. 提取 chatId
3. 查询群聊成员列表
4. 创建 TeamIdentity
```

### 2. 本地记忆合并

```
Agent:
1. 读取本地 workspace/memory/
2. 提取可共享内容（排除私密信息）
3. 合并到团队记忆文件
```

### 3. 同步触发

**自动触发**：
- 重要决策记录时
- 项目进展更新时
- 团队偏好变化时

**手动触发**：
- 用户说"同步团队记忆"
- 用户说"查看团队记忆"

### 4. 隐私保护

**不共享的内容**：
- 个人私密信息（密码、私人对话）
- 单用户特定偏好（如果标记为 private）
- 临时会话内容（除非标记为可共享）

---

## 持久化存储

```json
// memory/team-memory-state.json
{
  "teams": {
    "oc_xxx123": {
      "chatId": "oc_xxx123",
      "chatName": "技术讨论群",
      "members": ["ou_abc", "ou_def", "ou_ghi"],
      "lastSync": "2026-04-11T23:00:00Z",
      "files": {
        "MEMORY.md": {
          "checksum": "sha256:abc123",
          "lastModified": "2026-04-11T23:00:00Z"
        }
      }
    }
  },
  "syncQueue": [
    {
      "teamId": "oc_xxx123",
      "type": "decision",
      "content": "采用 React 18",
      "timestamp": "2026-04-11T22:00:00Z"
    }
  ]
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| Git repo hash | 飞书群聊 ID |
| OAuth 认证 | 飞书内置认证 |
| 远程 API | 飞书云文档/消息 |
| 文件 watcher | heartbeat + 群聊事件 |
| 秘密扫描 | 同样需要（防止泄露） |

---

## 使用示例

### 示例 1：群聊决策记录

```
用户（在群聊）：我们决定用 Next.js 作为前端框架

Agent:
→ 发送飞书卡片到群聊：

👥 团队记忆同步
📝 新增决策：采用 Next.js 作为前端框架
决策时间：2026-04-11 23:00
决策成员：技术讨论群

已同步到团队记忆文件。
```

### 示例 2：查看团队记忆

```
用户：查看团队记忆

Agent:
→ 发送飞书卡片：

👥 团队记忆

最近决策：
- 采用 Next.js（2026-04-11）
- 使用 TypeScript strict mode（2026-04-08）

项目进展：
- 记忆系统：完成
- 前端重构：进行中

更新时间：2026-04-11 23:00
```

### 示例 3：隐私保护

```
用户（私聊）：我的密码是 xxx

Agent:
→ 不同步到团队记忆
→ 标记为 private
→ 只存储在用户个人 MEMORY.md
```

---

## 配置

```yaml
teamMemorySync:
  enabled: true
  autoSync: true         # 自动同步决策和进展
  syncInterval: 300      # 同步间隔（秒）
  privacyMode: strict    # strict | moderate | open
  notifyGroup: true      # 群聊通知同步
  storage: feishu-doc    # feishu-doc | feishu-message | local
```

---

## 隐私级别

| 级别 | 说明 | 共享内容 |
|------|------|----------|
| `strict` | 严格隐私保护 | 只共享明确标记的内容 |
| `moderate` | 平衡模式 | 共享决策、进展、偏好，不共享私密信息 |
| `open` | 开放模式 | 共享所有记忆（不推荐） |

---

## 注意事项

1. **隐私第一**：绝不共享私密信息
2. **明确标记**：用户可以标记内容为 private/public
3. **群聊权限**：只同步到用户所在的群聊
4. **冲突处理**：多人同时更新时的合并策略
5. **版本历史**：保留变更历史，可回滚

---

## 下一步增强

- 飞书云文档集成（真正的文件存储）
- 团队记忆编辑界面（飞书卡片编辑）
- 冲突解决机制（多人同时编辑）
- 记忆访问权限控制（谁可以看什么）

---

## 自动启用

此 Skill 在群聊场景自动激活，检测重要决策/进展时自动同步。