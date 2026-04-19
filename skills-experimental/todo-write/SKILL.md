---
name: todo-write
description: "Track complex multi-step tasks with structured todo lists. Use when: task requires 3+ steps, user provides multiple tasks, or complex multi-operation work. Shows progress via Feishu interactive cards."
metadata:
  openclaw:
    emoji: "📋"
    triggers: [manual, auto]
    feishuCard: true
---

# TodoWrite Skill - 任务追踪

用结构化任务列表追踪复杂多步骤任务，飞书卡片展示进度。

## 触发条件

### 自动触发
- 任务需要 3+ 个步骤
- 用户提供多个任务（逗号分隔或编号列表）
- 复杂多操作任务（代码重构、系统设计等）

### 手动触发
- 用户说"创建任务列表"、"追踪进度"
- 用户说"帮我规划一下"

### 不触发
- 单一简单任务
- 纯对话/信息查询
- 可在 3 步内完成的简单任务

---

## 任务状态

| 状态 | 含义 | 飞书显示 |
|------|------|----------|
| `pending` | 未开始 | ⚪ 灰色 |
| `in_progress` | 正在进行 | 🟡 黄色 + 进度动画 |
| `completed` | 已完成 | ✅ 绿色 |

**规则**：只有 ONE 任务可以是 `in_progress`（不能多，不能少）

---

## 任务结构

```typescript
interface TodoItem {
  content: string      // 命令式："Run tests"
  activeForm: string   // 进行式："Running tests"
  status: 'pending' | 'in_progress' | 'completed'
}
```

**示例**：
```json
[
  {"content": "分析 Claude Code 源码", "activeForm": "分析 Claude Code 源码", "status": "completed"},
  {"content": "创建 TodoWrite Skill", "activeForm": "创建 TodoWrite Skill", "status": "in_progress"},
  {"content": "实现飞书卡片展示", "activeForm": "实现飞书卡片展示", "status": "pending"}
]
```

---

## 飞书卡片展示

### 任务列表卡片

```json
{
  "config": {
    "wide_screen_mode": true
  },
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📋 任务进度**\n\n✅ 已完成：分析 Claude Code 源码\n🟡 进行中：创建 TodoWrite Skill\n⚪ 待完成：实现飞书卡片展示"
      }
    },
    {
      "tag": "note",
      "elements": [
        {
          "tag": "plain_text",
          "content": "进度：1/3 完成"
        }
      ]
    }
  ]
}
```

### 进度条卡片

```json
{
  "config": {
    "wide_screen_mode": true
  },
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**正在执行**：创建 TodoWrite Skill\n\n进度：`███░░░░░░░` 33%"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 创建任务列表

当检测到复杂任务时：

```
用户：帮我实现记忆系统的三个功能：Compaction、Insights、Prompt Suggestion

Agent:
1. 分析任务 → 识别为多步骤任务
2. 创建任务列表：
   [
     {"content": "检查 Compaction 是否存在", "status": "in_progress", "activeForm": "检查 Compaction"},
     {"content": "创建 Insights Skill", "status": "pending", "activeForm": "创建 Insights Skill"},
     {"content": "创建 Prompt Suggestion Skill", "status": "pending", "activeForm": "创建 Prompt Suggestion Skill"}
   ]
3. 发送飞书卡片展示任务列表
```

### 2. 更新任务状态

```
Agent:
1. 完成检查 Compaction → 发现已存在
2. 立即更新任务状态（不批量）：
   - Compaction → completed
   - Insights → in_progress
3. 发送飞书卡片更新进度
```

### 3. 任务完成规则

- **立即标记完成**（不批量）
- **只有真正完成才标记**：
  - 测试通过
  - 实现完整
  - 无未解决错误
- **遇到阻塞时**：
  - 保持 in_progress
  - 创建新任务描述阻塞问题

---

## 持久化存储

任务列表存储在：

```json
// memory/todo-state.json
{
  "todos": [
    {"content": "...", "status": "...", "activeForm": "..."}
  ],
  "createdAt": "2026-04-11T23:00:00Z",
  "updatedAt": "2026-04-11T23:05:00Z",
  "sessionKey": "agent:main:main"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| Ink 终端 UI | 飞书交互卡片 |
| 实时进度条 | 卡片消息更新 |
| 本地任务列表 | 持久化到 memory/todo-state.json |
| 单用户 | 可扩展为多用户共享 |

---

## 使用示例

### 示例 1：多步骤任务

```
用户：帮我重构这个函数，改名、添加注释、优化性能

Agent: 
📋 任务列表：
1. ✅ 分析现有函数结构
2. 🟡 重命名函数及其调用点
3. ⚪ 添加文档注释
4. ⚪ 性能优化分析
5. ⚪ 运行测试验证

正在执行：重命名函数...
```

### 示例 2：用户提供任务列表

```
用户：我要做这些：
1. 设置开发环境
2. 安装依赖
3. 创建项目结构
4. 编写第一个模块

Agent:
📋 已创建任务列表（4项）：
🟡 正在：设置开发环境
⚪ 待完成：安装依赖
⚪ 待完成：创建项目结构
⚪ 待完成：编写第一个模块
```

### 示例 3：不触发

```
用户：帮我打印 hello world

Agent: （不创建任务列表，直接执行）
print("Hello World")
```

---

## 配置

```yaml
todoWrite:
  enabled: true
  autoCreate: true         # 自动创建任务列表
  minSteps: 3              # 最少步骤数触发
  feishuCardUpdate: true   # 飞书卡片实时更新
  persistToMemory: true    # 持久化到 memory/todo-state.json
```

---

## 注意事项

1. **只有 ONE 任务 in_progress**（这是关键规则）
2. **立即标记完成**（不批量更新）
3. **真正完成才标记**（测试通过、无错误）
4. **移除无关任务**（不再相关的从列表删除）
5. **简洁描述**（避免过长任务名）

---

## 自动启用

此 Skill 自动检测复杂任务并创建任务列表，用户无需手动调用。