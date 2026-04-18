---
name: insights
description: "Auto analyze recent sessions to extract user preferences and work patterns. Use when: heartbeat triggers and lastInsightsAnalysis > 6 hours ago."
metadata:
  openclaw:
    emoji: "💡"
    triggers: [heartbeat]
    intervalHours: 6
---

# Insights Skill - 洞察分析

自动分析历史会话，提取用户偏好和工作模式。

## 触发条件

- Heartbeat 定期触发（每 4-6 小时）
- 或用户显式调用 `/insights`
- 检查距上次分析 > 6 小时

## 执行流程

### 1. 收集数据

- 读取最近 N 个 daily notes (`memory/YYYY-MM-DD.md`)
- 读取 MEMORY.md 当前内容
- 读取飞书会话历史（如果可获取）

### 2. 分析维度

参考 Claude Code `commands/insights.ts` 的 facet extraction：

**用户画像维度**：
- 常见任务类型（代码？文档？日常？）
- 常用工具/技能偏好
- 交互风格（简洁？详细？）
- 时间模式（白天活跃？晚上？）

**工作模式维度**：
- 项目进展节奏
- 决策风格（自主？询问确认？）
- 学习速度

**偏好维度**：
- 喜欢的回复风格
- 不喜欢的行为
- 常用的命令/功能

### 3. 输出格式

生成 Markdown 报告：

```markdown
# Insights Report - YYYY-MM-DD

## 🎯 用户画像
- 主要任务类型：代码架构分析、系统设计
- 常用功能：记忆维护、文档编辑
- 交互风格：简洁，偏好自主决策

## 📊 工作模式
- 活跃时间：晚间 22:00-23:00
- 项目节奏：一次性深入分析，非持续迭代
- 决策风格：自主决策，仅重要事项确认

## ❤️ 偏好
- 喜欢简洁回复，避免过多解释
- 希望自动执行，不手动触发
- 关注记忆系统自动化

## 🔍 发现
- 用户对 OpenClaw 和 Claude Code 架构有深入了解
- 正在构建记忆系统自动化能力
- 倾向于借鉴而非复制

## 💡 建议
- 继续优化 heartbeat 记忆维护
- 可添加飞书内洞察报告展示
```

### 4. 更新 MEMORY.md

将关键发现合并到 MEMORY.md：
- User Profile 区块
- Learnings 区块（如果有新教训）

### 5. 通知用户

如果发现重要变化或新洞察，通过飞书通知：
```
"我分析了最近的会话，发现你喜欢简洁回复和自主决策。
已更新记忆文件来记住这些偏好。"
```

## 状态追踪

```json
// memory/heartbeat-state.json
{
  "lastInsightsAnalysis": <timestamp>,
  "insightsNotes": "上次分析发现..."
}
```

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| 终端输出报告 | 飞书卡片展示 |
| 本地会话文件分析 | memory/*.md + 飞书历史 |
| Facet extraction 用 Opus | 用当前模型（成本更低） |

## 配置

```yaml
# 可选配置
insights:
  enabled: true
  intervalHours: 6
  maxSessionsAnalyzed: 10
  notifyOnChanges: true
```

---

## 自动启用

此 Skill 在 heartbeat 时自动检查并执行，用户无需手动调用。