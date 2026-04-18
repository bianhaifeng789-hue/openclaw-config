# OpenClaw智能激活配置

## 核心原则（借鉴Matt Pocock）

**Description是Agent唯一看到的内容**，决定了Skills是否被正确激活。

## 自动激活机制

### 1. Description格式标准
```yaml
description: "Brief capability description. Use when [specific triggers]."
```

**要求**:
- Max 1024 chars
- Third person
- 必须包含"Use when"

### 2. 触发词模式

| 场景 | 触发词示例 |
|------|-----------|
| 文件类型 | Use when working with .pdf files |
| 关键词 | Use when user mentions "PRD" |
| 操作 | Use when creating, updating, or reviewing |
| 上下文 | Use when user asks about testing |

### 3. 高优先级Skills（自动激活）

以下Skills在特定场景**自动激活**（通过description精准触发）：

**PRD工作流**:
- write-a-prd: Use when user wants to write a PRD, create product requirements
- prd-to-plan: Use when user wants to break down a PRD, create implementation plan
- prd-to-issues: Use when user wants to convert a PRD to issues

**TDD方法论**:
- tdd-vertical-slices: Use when user mentions "red-green-refactor", TDD
- testing-philosophy: Use when discussing testing strategy, reviewing tests

**架构设计**:
- deep-modules: Use when designing interfaces, planning refactors
- dependency-categories: Use when analyzing module dependencies

**GitHub管理**:
- github-triage: Use when user wants to triage issues, review incoming bugs

## 验证机制

### 心跳任务监测
新增心跳任务: `skill-activation-monitor`（每1h）

```yaml
- name: skill-activation-monitor
  interval: 1h
  priority: medium
  prompt: "Check which Skills were activated in last hour. Report activation stats via Feishu card. If low activation (<5 skills), analyze description quality."
```

### Hooks自动触发
关键Skills通过Hooks自动触发：

| Event | Triggered Skill |
|-------|----------------|
| PreToolUse (read/write) | git-guardrails |
| PostToolUse (error) | tool-error-handling |
| PostModelUse (first exchange) | title-auto-gen |

## 使用统计

追踪哪些Skills被实际使用：

```bash
# 查看Skills使用统计（未来实现）
node impl/bin/skill-usage-tracker.js stats
```

## 下一步优化

1. 监测Skills激活准确率
2. 低激活Skills优化description
3. 高频Skills优先级提升
4. 冷门Skills考虑移除

---

_借鉴来源: Matt Pocock skill-description-guide_
_创建时间: 2026-04-15_