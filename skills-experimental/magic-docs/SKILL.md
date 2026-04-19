---
name: magic-docs
description: "Automatically maintain markdown documentation files marked with special headers. When file with '# MAGIC DOC: [title]' is read, runs periodically in background to update with new learnings. Use when [magic docs] is needed."
metadata:
  openclaw:
    emoji: "✨"
    triggers: [magic-doc-detected, file-read]
    feishuCard: true
---

# Magic Docs Skill - 自动更新文档

自动维护标记为 Magic Doc 的 markdown 文档，定期后台更新。

## 为什么需要这个？

**场景**：
- API 文档自动更新
- README 自动维护
- 项目指南自动刷新
- 学习笔记自动整理

**Claude Code 方案**：Magic Docs service + forked subagent
**OpenClaw 飞书适配**：file read hook + sessions_spawn

---

## Magic Doc 标记

文件头部特殊标记：

```markdown
# MAGIC DOC: API 文档

_整理 API endpoints 和使用说明_

## 概述
...
```

**标记格式**：
- `# MAGIC DOC: [title]` - 必须在第一行
- `_instructions_` - 斜体指令（可选，第二行）

---

## 检测逻辑

当文件被读取时，检测 Magic Doc 标记：

```typescript
const MAGIC_DOC_HEADER_PATTERN = /^#\s*MAGIC\s+DOC:\s*(.+)$/im
const ITALICS_PATTERN = /^[_*](.+?)[_*]\s*$/m

function detectMagicDocHeader(content: string) {
  const match = content.match(MAGIC_DOC_HEADER_PATTERN)
  if (!match) return null

  const title = match[1].trim()

  // 检查第二行斜体指令
  const nextLineMatch = ...
  if (nextLineMatch) {
    const instructions = nextLineMatch[1].trim()
    return { title, instructions }
  }

  return { title }
}
```

---

## 飞书卡片格式

### Magic Doc 发现卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**✨ 发现 Magic Doc**\n\n**文件**：`API.md`\n**标题**：API 文档\n**指令**：整理 API endpoints 和使用说明\n\n**状态**：已注册，将定期更新"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "下次更新：24 小时后"}
      ]
    }
  ]
}
```

### Magic Doc 更新卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**✨ Magic Doc 已更新**\n\n**文件**：`API.md`\n**标题**：API 文档\n\n**更新内容**：\n• 新增：POST /auth/login\n• 新增：GET /user/profile\n• 更新：认证说明\n• 优化：格式整理\n\n**更新时间**：2026-04-11 23:30"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 文件读取检测

```
File Read:
1. 用户请求读取文件
2. 检测文件开头是否为 Magic Doc
3. 如果是：
   → 注册 Magic Doc（trackedMagicDocs）
   → 发送飞书卡片："✨ 发现 Magic Doc"
```

### 2. 定期更新

```
Heartbeat:
1. 检查 trackedMagicDocs
2. 距离上次更新 >= 24 小时：
   → 使用 sessions_spawn 创建 forked agent
   → 运行 Magic Doc 更新 prompt
   → 更新文档内容
   → 发送飞书卡片："✨ Magic Doc 已更新"
```

### 3. 更新 Prompt

```
更新 Magic Doc: [title]

指令：[instructions]

近期对话内容：
[conversation summary]

请更新文档，保持原有结构，添加新内容。
```

---

## 持久化存储

```json
// memory/magic-docs-state.json
{
  "trackedDocs": [
    {
      "path": "API.md",
      "title": "API 文档",
      "instructions": "整理 API endpoints",
      "detectedAt": "2026-04-11T23:00:00Z",
      "lastUpdated": "2026-04-11T23:00:00Z",
      "nextUpdate": "2026-04-12T23:00:00Z"
    }
  ],
  "stats": {
    "docsDetected": 0,
    "docsUpdated": 0
  }
}
```

---

## Forked Agent

```typescript
sessions_spawn({
  runtime: 'subagent',
  mode: 'run',
  task: '更新 Magic Doc: API.md...',
  label: 'magic-doc-agent',
  lightContext: true,
  timeoutSeconds: 300  // 5 分钟
})
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| FileReadTool listener | file read hook 或手动检测 |
| registerPostSamplingHook | heartbeat + sessions_spawn |
| runForkedAgent | sessions_spawn |
| MagicDocInfo（内部 Map） | magic-docs-state.json |
| sequential() 序列化 | 无并行限制 |

---

## 适用文件类型

| 文件 | 说明 | 指令示例 |
|------|------|----------|
| `API.md` | API 文档 | "整理 endpoints 和使用说明" |
| `README.md` | 项目介绍 | "更新项目进展和使用方法" |
| `GUIDE.md` | 开发指南 | "记录最佳实践和注意事项" |
| `CHANGELOG.md` | 变更记录 | "记录重要变更和版本信息" |
| `LEARNING.md` | 学习笔记 | "整理学到的知识和技巧" |

---

## 注意事项

1. **第一行标记**：必须在文件开头（第一行）
2. **斜体指令**：可选，但建议提供明确的指令
3. **定期更新**：24 小时一次（避免频繁）
4. **结构保持**：更新时保持原有结构
5. **新增内容**：只添加新内容，不删除旧内容

---

## 自动启用

此 Skill 在检测到 Magic Doc 标记时自动注册，定期更新。

---

## 下一步增强

- 文件编辑后立即更新（可选）
- 多 Magic Doc 并行更新
- 更新质量评估
- 更新历史记录