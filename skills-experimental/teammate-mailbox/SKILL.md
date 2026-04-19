---
name: teammate-mailbox
description: "File-based messaging system for agent swarms. Inbox files at .claude/teams/{team_name}/inboxes/{agent_name}.json. Lock-based concurrent access. TeammateMessage type. Use when [teammate mailbox] is needed."
metadata:
  openclaw:
    emoji: "📬"
    triggers: [teammate-message, swarm-coordination]
    feishuCard: true
---

# Teammate Mailbox Skill - Teammate 邮箱系统

文件邮箱系统，用于 agent swarms 消息传递。

## 为什么需要这个？

**场景**：
- Agent swarm 协调
- 文件邮箱系统
- 消息传递
- 并发访问控制
- Teammate 通信

**Claude Code 方案**：teammateMailbox.ts + File-based messaging
**OpenClaw 飞书适配**：邮箱系统 + 消息传递

---

## TeammateMessage Type

```typescript
interface TeammateMessage {
  from: string         // Sender agent name
  text: string         // Message content
  timestamp: string    // ISO timestamp
  read: boolean        // Whether read
  color?: string       // Sender's color
  summary?: string     // 5-10 word preview
}
```

---

## Functions

### 1. Get Inbox Path

```typescript
function getInboxPath(agentName: string, teamName?: string): string {
  const team = teamName || getTeamName() || 'default'
  const safeTeam = sanitizePathComponent(team)
  const safeAgentName = sanitizePathComponent(agentName)
  const inboxDir = join(getTeamsDir(), safeTeam, 'inboxes')
  return join(inboxDir, `${safeAgentName}.json`)
}
```

### 2. Read Mailbox

```typescript
async function readMailbox(
  agentName: string,
  teamName?: string
): Promise<TeammateMessage[]> {
  const inboxPath = getInboxPath(agentName, teamName)
  
  try {
    const content = await readFile(inboxPath, 'utf-8')
    return JSON.parse(content) as TeammateMessage[]
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}
```

### 3. Write to Mailbox

```typescript
async function writeToMailbox(
  agentName: string,
  message: TeammateMessage,
  teamName?: string
): Promise<void> {
  // Ensure inbox directory exists
  await ensureInboxDir(teamName)
  
  // Read existing messages
  const messages = await readMailbox(agentName, teamName)
  
  // Add new message
  messages.push(message)
  
  // Write with lock
  const inboxPath = getInboxPath(agentName, teamName)
  await lockfile.lock(inboxPath, LOCK_OPTIONS)
  await writeFile(inboxPath, JSON.stringify(messages))
  await lockfile.unlock(inboxPath)
}
```

---

## 飞书卡片格式

### Teammate Mailbox 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📬 Teammate Mailbox**\n\n---\n\n**消息列表**：\n\n| 发送者 | 消息 | 时间 | 状态 |\n|--------|------|------|------|\n| researcher | Task completed | 00:59 | ✓ Read |\n| tester | Tests passed | 00:55 | ⏳ Unread |\n\n---\n\n**邮箱路径**：\n```\n.claude/teams/{team}/inboxes/{agent}.json\n```\n\n---\n\n**并发控制**：\n• Lock-based access\n• Retry with backoff\n• 10 retries (5-100ms)"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/teammate-mailbox-state.json
{
  "mailboxes": {},
  "stats": {
    "totalMessages": 0,
    "unreadCount": 0,
    "sentCount": 0
  },
  "config": {
    "lockRetries": 10,
    "lockMinTimeout": 5,
    "lockMaxTimeout": 100
  },
  "lastUpdate": "2026-04-12T00:59:00Z",
  "notes": "Teammate Mailbox Skill 创建完成。等待 teammate message 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| teammateMailbox.ts | Skill + Mailbox |
| TeammateMessage | Message type |
| writeToMailbox() | Write with lock |
| readMailbox() | Read messages |
| LOCK_OPTIONS | Retry with backoff |

---

## 注意事项

1. **Lock-based**：并发访问使用 lockfile
2. **Retry backoff**：10 retries (5-100ms)
3. **Inbox path**：`.claude/teams/{team}/inboxes/{agent}.json`
4. **Message type**：TeammateMessage
5. **Sanitize**：sanitizePathComponent for names

---

## 自动启用

此 Skill 在 teammate 消息传递时自动运行。

---

## 下一步增强

- 飞书邮箱集成
- Message analytics
- Unread tracking