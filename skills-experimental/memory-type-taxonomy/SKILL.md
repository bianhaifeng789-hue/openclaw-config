---
name: memory-type-taxonomy
description: |
  Four-type memory taxonomy for structured memory extraction: user, feedback, project, reference. Defines what to save, when to save, and how to use each type.
  
  Use when:
  - Extracting memories from conversation
  - Deciding which memory type to use for new information
  - Writing memory files with correct frontmatter
  - Reviewing what should/shouldn't be saved as memory
  
  Keywords: memory type, user memory, feedback memory, project memory, reference memory, memory taxonomy
metadata:
  openclaw:
    emoji: "🗂️"
    source: claude-code-memory-types
    triggers: [memory-extraction, memory-type, save-memory, memory-taxonomy]
    priority: P0
---

# Memory Type Taxonomy

基于 Claude Code `memdir/memoryTypes.ts` 的四类记忆分类系统。

## 四种记忆类型（来自 Claude Code）

### 1. user（用户记忆）
```
范围: 始终私有
内容: 用户的角色、目标、职责、知识背景
何时保存: 了解到用户的角色、偏好、职责或知识时
如何使用: 根据用户背景调整回答方式
```

**示例**:
- "用户是数据科学家，专注于可观测性/日志"
- "深厚 Go 经验，第一次接触这个项目的 React 前端"

**不要保存**: 对用户的负面判断，或与工作无关的信息

---

### 2. feedback（反馈记忆）
```
范围: 默认私有；仅当是项目级约定时才保存为团队记忆
内容: 用户对工作方式的指导——避免什么、继续什么
何时保存: 
  - 用户纠正你的方式（"不要这样"、"停止做X"）
  - 用户确认某种方式有效（"对，就是这样"、"完美"）
格式: 规则本身 + Why: 原因 + How to apply: 适用场景
```

**示例**:
- "集成测试必须使用真实数据库，不能 mock。原因：上季度 mock 测试通过但生产迁移失败"
- "这个用户不需要响应末尾的总结，他能看 diff"

---

### 3. project（项目记忆）
```
范围: 私有或团队，强烈偏向团队
内容: 正在进行的工作、目标、bug、事件——不能从代码或 git 历史推导出的信息
何时保存: 了解到谁在做什么、为什么、截止日期时
注意: 相对日期转换为绝对日期（"周四" → "2026-04-17"）
```

**示例**:
- "用户正在重构认证模块，目标是 2026-04-20 前完成"
- "当前 bug：登录后偶发 500 错误，怀疑是 session 竞争条件"

---

### 4. reference（参考记忆）
```
范围: 私有或团队
内容: 外部资源、文档、API、工具的参考信息
何时保存: 发现有用的外部资源或需要记住的技术细节时
```

**示例**:
- "飞书 API 文档：https://open.feishu.cn/document/"
- "OpenClaw 配置文件位置：~/.openclaw/workspace/"

---

## 不应保存的内容

```
❌ 可以从代码推导的信息（代码模式、架构、文件结构）
❌ 可以从 git 历史推导的信息
❌ 可以从 CLAUDE.md/AGENTS.md 读取的信息
❌ 对用户的负面判断
❌ 与工作无关的个人信息
```

## 记忆文件格式（frontmatter）

```markdown
---
type: user|feedback|project|reference
title: 简短标题
tags: [tag1, tag2]
---

记忆内容...
```

## OpenClaw 适配

### 存储位置
```
memory/
  user_role.md          # user 类型
  feedback_testing.md   # feedback 类型
  project_auth.md       # project 类型
  reference_feishu.md   # reference 类型
  MEMORY.md             # 索引（每条一行，<150字符）
```

### MEMORY.md 索引格式
```markdown
- [用户角色](user_role.md) — 数据科学家，专注可观测性
- [测试规范](feedback_testing.md) — 集成测试必须用真实数据库
- [认证重构](project_auth.md) — 截止 2026-04-20
```

### 提取时的效率策略（来自 Claude Code）
```
第 1 轮：并行读取所有可能需要更新的文件
第 2 轮：并行写入所有更新
不要跨多轮交替读写
```
