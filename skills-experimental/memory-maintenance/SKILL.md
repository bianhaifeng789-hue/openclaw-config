---
name: memory-maintenance
description: "Auto memory extraction and MEMORY.md updates triggered by heartbeat. Use when: heartbeat triggers and lastMemoryReview > 2 hours ago."
metadata:
  openclaw:
    emoji: "🧠"
    triggers: [heartbeat]
    intervalHours: 2
---

# Memory Maintenance Skill

自动记忆维护技能。由 heartbeat 定期触发，无需用户指令。

## 触发条件

- Heartbeat 定期轮询（约每 2-4 小时）
- 检查 `memory/heartbeat-state.json` 中 `lastMemoryReview` 时间
- 如果距离上次 > 2 小时，执行维护

## 执行流程

### 1. 检查状态

```json
// memory/heartbeat-state.json
{
  "lastChecks": {
    "memory_maintenance": <timestamp>
  },
  "lastMemoryReview": <timestamp>
}
```

如果 `lastMemoryReview` 为 null 或距离现在 > 2 小时（7200 秒），继续执行。

### 2. 读取最近会话

读取最近的 daily note 和飞书会话历史（如果可获取），提取关键信息。

### 3. 分析并提取

关注以下类型的信息：

- **决策**：用户做出的选择，或明确的偏好表达
- **进度**：项目进展、任务完成状态
- **偏好**：用户对某事物的态度（喜欢/不喜欢）
- **教训**：什么有效、什么无效、避免什么
- **关键结果**：用户特别想要记住的答案或输出

### 4. 更新 MEMORY.md

使用 `<!-- AUTO_UPDATE: xxx -->` 标记区块：

```markdown
<!-- AUTO_UPDATE: current_focus -->
更新的内容...
<!-- END_AUTO_UPDATE -->
```

只更新标记区块，不修改手动编辑的部分。

### 5. 更新状态文件

```json
{
  "lastMemoryReview": <current_timestamp>
}
```

写入 `memory/heartbeat-state.json`

### 6. 返回结果

- 如果有重要更新：简要告知用户（如 "已更新项目进度到 MEMORY.md"）
- 如果无新内容：返回 `HEARTBEAT_OK`（静默）

## 注意事项

- **不要重复提取**：已在 MEMORY.md 的内容不重复
- **简洁优先**：只保留真正有价值的信息，避免堆砌
- **保护隐私**：敏感信息不写入（如密码、私密对话）
- **静默运行**：除非有重要发现，否则不打扰用户

## Markdown 区块更新函数

可用此模式更新区块：

```typescript
// 替换标记区块内容
const startMarker = `<!-- AUTO_UPDATE: ${blockName} -->`;
const endMarker = `<!-- END_AUTO_UPDATE -->`;
// 找到区块，替换中间内容
```

## 示例

### 输入（daily note）
```
# 2026-04-11 Memory Log

## Session Summary
- 用户决定借鉴 Claude Code 的 Session Memory 机制
- 创建了 coding-agent skill
- 发现 Claude Code 使用 forked agent 后台提取记忆
```

### 输出（MEMORY.md 更新）

```markdown
<!-- AUTO_UPDATE: key_decisions -->
- 2026-04-11: 决定借鉴 Claude Code Session Memory 机制
- 理由：飞书场景优先需要自动记忆提取
<!-- END_AUTO_UPDATE -->

<!-- AUTO_UPDATE: learnings -->
- Claude Code 用 forked agent 后台提取，不影响主会话
- 记忆提取应在会话结束后运行
<!-- END_AUTO_UPDATE -->

<!-- AUTO_UPDATE: projects -->
### 记忆系统增强
- 状态：设计中 → 已创建 MEMORY.md 结构
- 进度：基础框架完成，heartbeat 任务配置完成
<!-- END_AUTO_UPDATE -->
```

---

## 自动启用

此 Skill 在 heartbeat 时自动检查并执行，用户无需手动调用。

首次启用时，AGENTS.md 的 heartbeat 检查列表应包含此任务。