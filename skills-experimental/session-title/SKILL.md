---
name: session-title
description: "Auto-generate session title using AI. Title should be clear, concise, 6 words max. Use sentence case. Generate from session description. Use when [session title] is needed."
metadata:
  openclaw:
    emoji: "🏷️"
    triggers: [session-create, session-resume]
    feishuCard: true
---

# Session Title Skill - 会话标题生成

使用 AI 自动生成会话标题，简洁明了地描述会话内容。

## 为什么需要这个？

**场景**：
- 新会话创建时
- 会话恢复时
- 用户请求重命名
- 需要简洁描述会话内容

**Claude Code 方案**：Teleport + Haiku model
**OpenClaw 飞书适配**：AI 生成 + 飞书卡片确认

---

## Title 要求

### 格式要求

```
• **简洁**：6 words max
• **Case**：Sentence case（首字母大写）
• **内容**：准确反映会话内容
• **避免**：Jargon 和过度技术术语
```

### 示例

```
Good:
• "Fix login button not working on mobile"
• "Update README with installation instructions"
• "Improve performance of data processing script"
• "Add dark mode support to UI"

Bad:
• "Fix bug found while testing with Claude"
• "1-shotted by claude-opus-4-6"
• "Generated with Claude Code"
```

---

## Prompt 模板

```
You are coming up with a succinct title for a coding session based on the provided description. The title should be clear, concise, and accurately reflect the content of the coding task.

You should keep it short and simple, ideally no more than 6 words. Avoid using jargon or overly technical terms unless absolutely necessary. The title should be easy to understand for anyone reading it.

Use sentence case for the title (capitalize only the first word and proper nouns), not Title Case.

Return a JSON object with "title" field.

Example 1: {"title": "Fix login button not working on mobile"}
Example 2: {"title": "Update README with installation instructions"}
Example 3: {"title": "Improve performance of data processing script"}

Here is the session description:
<description>{description}</description>
Please generate a title for this session.
```

---

## 飞书卡片格式

### Title 建议卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🏷️ Session Title 建议**\n\n**基于会话内容生成**：\n\n**建议标题**：\n`Fix login button on mobile`\n\n---\n\n**描述摘要**：\n用户报告登录按钮在移动端点击无响应，需要检查响应式布局和事件处理。\n\n---\n\n**是否使用此标题？**"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "使用此标题"},
          "type": "primary",
          "value": {"action": "use_title", "title": "Fix login button on mobile"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "自定义标题"},
          "type": "default",
          "value": {"action": "custom_title"}
        }
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 提取会话描述

```
Session Title:
1. 分析最近对话内容
2. 提取主要任务描述
3. 生成简洁摘要
4. 构造 prompt
```

### 2. AI 生成标题

```typescript
async function generateTitle(description: string): Promise<string> {
  // 使用 AI 生成标题
  const prompt = TITLE_PROMPT_TEMPLATE.replace('{description}', description)
  
  // 调用 AI（可以是当前模型或轻量模型）
  const response = await query(prompt)
  
  // 解析 JSON response
  const title = parseTitleFromJson(response)
  
  return title
}
```

### 3. 飞书卡片确认

```
Agent:
1. 生成标题建议
2. 发送飞书卡片确认
3. 用户选择（使用/自定义）
4. 更新 session title
```

---

## 持久化存储

```json
// memory/session-title-state.json
{
  "titlesGenerated": [
    {
      "sessionId": "session-1",
      "title": "Fix login button on mobile",
      "description": "用户报告登录按钮...",
      "timestamp": "2026-04-12T00:00:00Z"
    }
  ],
  "stats": {
    "titlesGenerated": 0,
    "titlesAccepted": 0,
    "titlesCustomized": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| Haiku model | 当前模型或轻量模型 |
| Teleport | 不需要跨机器 |
| Branch name generation | 飞书 session title |
| Terminal UI | 飞书卡片确认 |
| 自动生成 | 同样自动生成 |

---

## 注意事项

1. **6 words max**：保持简洁
2. **Sentence case**：首字母大写
3. **避免 AI attribution**：不提及 Claude/AI
4. **准确描述**：反映实际内容
5. **用户确认**：飞书卡片选择

---

## 自动启用

此 Skill 在新会话或恢复会话时自动触发。

---

## 下一步增强

- Title history
- Title analytics
- 自动更新 title（任务变化时）
- Branch name 生成（Git 场景）