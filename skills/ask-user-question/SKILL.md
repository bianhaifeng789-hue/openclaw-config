---
name: ask-user-question
description: "Ask users multiple choice questions via Feishu interactive cards. Use when: gathering preferences, clarifying ambiguity, making decisions, offering choices."
metadata:
  openclaw:
    emoji: "❓"
    triggers: [decision-point, ambiguity, preference-gathering]
    feishuCard: true
---

# Ask User Question Skill - 多选题询问

飞书交互卡片多选题，收集用户偏好、澄清模糊、提供选择。

## 为什么需要这个？

**场景**：
- 多种方案选择（A/B/C）
- 模糊指令澄清
- 用户偏好收集
- 决策点引导

**Claude Code 方案**：AskUserQuestionTool + Ink 终端 UI
**OpenClaw 飞书适配**：飞书交互卡片 + 按钮回调

---

## 飞书卡片格式

### 单选题卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**❓ 请选择**\n\n**问题**：你想要哪种认证方案？\n\n**选项**："
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "JWT（推荐）"},
          "type": "primary",
          "value": {"option": "jwt", "questionId": "auth-method"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "Session"},
          "type": "default",
          "value": {"option": "session", "questionId": "auth-method"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "OAuth"},
          "type": "default",
          "value": {"option": "oauth", "questionId": "auth-method"}
        }
      ]
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "点击按钮选择，或回复其他方案"}
      ]
    }
  ]
}
```

### 多选题卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**❓ 请选择（可多选）**\n\n**问题**：你希望包含哪些功能？\n\n**选项**："
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "✓ 登录"},
          "type": "primary",
          "value": {"option": "login", "multi": true, "questionId": "features"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "✓ 注册"},
          "type": "primary",
          "value": {"option": "register", "multi": true, "questionId": "features"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "✓ 密码重置"},
          "type": "default",
          "value": {"option": "reset", "multi": true, "questionId": "features"}
        }
      ]
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "确认选择"},
          "type": "primary",
          "value": {"action": "confirm_multi", "questionId": "features"}
        }
      ]
    }
  ]
}
```

---

## 使用场景

### 1. 方案选择

```
用户：帮我实现认证系统

Agent:
→ 发现多种方案可选
→ 发送飞书卡片：

❓ 请选择认证方案

JWT（推荐）- 无状态，适合分布式
Session - 传统，适合单体
OAuth - 第三方登录

[JWT] [Session] [OAuth]

→ 等待用户点击
→ 根据选择执行
```

### 2. 模糊指令澄清

```
用户：帮我优化这个函数

Agent:
→ 不清楚优化目标（性能？可读性？安全性？）
→ 发送飞书卡片：

❓ 你想优化什么方面？

性能（推荐）- 提升执行速度
可读性 - 改善代码结构
安全性 - 增强防护
全部 - 综合优化

→ 用户选择"性能"
→ 执行性能优化
```

### 3. 偏好收集

```
Agent:
→ 发现用户偏好未记录
→ 发送飞书卡片：

❓ 你喜欢什么样的回复风格？

简洁（推荐）- 直接给出结果
详细 - 包含分析和过程
互动 - 询问确认后再执行

→ 用户选择"简洁"
→ 更新 MEMORY.md User Profile
```

---

## 执行流程

### 1. 检测需要询问

**触发条件**：
- 多种方案可选（≥2个）
- 用户指令模糊
- 需要用户偏好
- 决策点（plan mode）

### 2. 生成问题卡片

```
Agent:
1. 分析可用选项
2. 推荐最佳选项（标记"推荐"）
3. 生成飞书卡片 JSON
4. 发送卡片
5. 等待用户响应
```

### 3. 处理用户响应

**飞书按钮回调**：
```
用户点击按钮 → 飞书发送回调 → Agent 解析 → 执行对应操作
```

**用户文字回复**：
```
用户回复文字 → Agent 解析意图 → 作为"Other"选项处理
```

---

## 持久化存储

```json
// memory/question-state.json
{
  "pendingQuestions": [
    {
      "id": "auth-method",
      "question": "选择认证方案",
      "options": ["jwt", "session", "oauth"],
      "multiSelect": false,
      "createdAt": "2026-04-11T23:00:00Z",
      "expiresAt": "2026-04-11T23:30:00Z"
    }
  ],
  "answeredQuestions": [
    {
      "id": "features",
      "question": "包含哪些功能",
      "selected": ["login", "register"],
      "answeredAt": "2026-04-11T22:00:00Z"
    }
  ],
  "stats": {
    "questionsAsked": 0,
    "questionsAnswered": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| AskUserQuestionTool | message tool + card |
| Ink 终端 UI | 飞书交互卡片 |
| 键盘输入选择 | 按钮点击 |
| preview 字段（ASCII mockup） | 飞书卡片预览 |
| 单选/多选 | 飞书按钮组 |

---

## 注意事项

1. **推荐标记**：推荐选项标记"（推荐）"，放在第一位
2. **Other 选项**：用户始终可以回复文字提供自定义选项
3. **过期时间**：问题卡片 30 分钟过期
4. **避免频繁**：不要连续发送多个问题卡片
5. **Plan Mode**：在 plan mode 用于澄清需求，不是问"准备好了吗"

---

## 自动启用

此 Skill 在检测到多种方案可选或模糊指令时自动触发。

---

## 下一步增强

- 飞书按钮回调处理（需要 API 支持）
- preview 字段（飞书卡片预览）
- 问题历史记录
- 用户偏好学习（减少重复询问）