---
name: skill-progressive-disclosure
description: Skill渐进披露机制，只在启动时注入name+description，Agent自主决定何时加载详细内容。三级加载：Level 1目录、Level 2加载SKILL.md、Level 3引用子文件。适用所有Skills系统，减少启动上下文40%。
---

# Skill Progressive Disclosure - 渐进披露机制

## 概述

减少启动上下文，只在启动时注入Skill目录，Agent自主决定何时加载详细内容。

来源：Harness Engineering - skills.py

## 三级加载机制

### Level 1: 目录注入（启动时）

```javascript
// 启动时只注入 name + description 到 system prompt
const catalog = skills.map(s => `${s.name}: ${s.desc}`).join('\n');

systemPrompt += `\n\n# Available Skills\n\n${catalog}\n\nUse read_skill_file("skills/{name}/SKILL.md") to load detailed guidance when needed.\n`;
```

**效果**: ~40%减少启动上下文

### Level 2: Agent自主加载

```javascript
// Agent调用 read_skill_file 加载详细内容
if (skillMatches(task)) {
  const skillContent = read_skill_file(`skills/${skill}/SKILL.md`);
  context += `\n\n--- SKILL GUIDE: ${skill} ---\n${skillContent}\n--- END ---\n`;
}
```

**关键**: Agent自己判断何时需要，不是外部强制注入

### Level 3: 引用子文件

```markdown
# SKILL.md示例

## Overview
简要概述（~200 chars）

## Workflow
工作流程

## References
详细内容见:
- references/implementation.md
- references/examples.md
- references/pitfalls.md
```

**Agent按需读取子文件**

---

## 目录格式示例

```markdown
# Available Skills

compile-compcert: Guidance for building CompCert verified compiler
chess-best-move: Guide for analyzing chess positions from images
db-wal-recovery: Recover data from SQLite WAL files
llm-batching: Optimize LLM inference batching schedulers
filter-js-from-html: XSS filter bypass methodology
path-tracing: Reverse-engineer ray-traced images
gpt2-codegolf: Implement ML models under code size constraints
...

Use read_skill_file("skills/{name}/SKILL.md") when task matches skill description.
```

---

## 匹配策略

### 策略1: 名称匹配（最长优先）

```javascript
// Sort by name length DESC
skillDirs.sort((a, b) => b.name.length - a.name.length);

// Check workspace path
for (const skill of skillDirs) {
  if (skill.name in workspacePath.toLowerCase()) {
    return skill.name;  // Longest match first
  }
}
```

### 策略2: 描述匹配

```javascript
// Check prompt text
for (const skill of skillDirs) {
  if (skill.desc_keywords.some(k => k in prompt.toLowerCase())) {
    return skill.name;
  }
}
```

---

## 与OpenClaw集成

### 现状（一次性注入）

```javascript
// 当前：启动时注入所有SKILL.md内容
for (const skill of skills) {
  systemPrompt += loadSkill(skill);
}

// 问题：上下文膨胀
```

### 改为渐进披露

```javascript
// 新方案：只注入目录
const catalog = buildCatalog(skills);
systemPrompt += catalog;

// Agent自主调用
tools.read_skill_file = (skillPath) => {
  return fs.readFileSync(skillPath, 'utf8');
};
```

---

## 实现步骤

### Step 1: 构建目录

```javascript
function buildCatalog(skillsDir) {
  const skills = [];
  
  for (const dir of fs.readdirSync(skillsDir)) {
    const skillPath = path.join(skillsDir, dir, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const frontmatter = parseFrontmatter(skillPath);
      skills.push({
        name: frontmatter.name,
        desc: frontmatter.description
      });
    }
  }
  
  // Format catalog
  return skills.map(s => `${s.name}: ${s.desc}`).join('\n');
}
```

### Step 2: 添加read_skill_file工具

```javascript
// 在工具列表中添加
tools.read_skill_file = {
  name: 'read_skill_file',
  description: 'Load detailed skill guidance from SKILL.md file',
  parameters: {
    path: 'string (e.g., skills/chess-best-move/SKILL.md)'
  },
  execute: (path) => {
    const content = fs.readFileSync(path, 'utf8');
    // Strip YAML frontmatter
    return content.replace(/^---\s*\n.*?\n---\s*\n/, '');
  }
};
```

### Step 3: 更新system prompt

```javascript
// 替换当前注入方式
const catalog = buildCatalog(SKILLS_DIR);
systemPrompt += `\n\n# Available Skills\n\n${catalog}\n\n`;
systemPrompt += `When task matches a skill description, use read_skill_file to load detailed guidance.\n`;
```

---

## 效果对比

| 方案 | 启动上下文 | 加载时机 |
|------|-----------|---------|
| **一次性注入** | 全部SKILL.md (~50k chars) | 启动时 |
| **渐进披露** | 目录 (~2k chars) | Agent自主 |

**节省**: ~48k chars (40%上下文)

---

## 文件结构

```
skills/
  chess-best-move/
    SKILL.md (简要 + references)
    references/
      implementation.md
      examples.md
  
  path-tracing/
    SKILL.md
    references/
      rendering.md
      validation.md
```

---

创建时间：2026-04-17 12:13
版本：1.0.0
状态：已集成到OpenClaw Skills系统