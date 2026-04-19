---
name: progress-persistence
description: Context Reset 进度持久化 - progress.md checkpoint + git diff context 注入。解决焦虑检测后的状态恢复问题。
---

# Progress Persistence - Context Reset 进度持久化

## 概述

解决 Context Reset 后 Agent 丢失进度的问题。

来源：Harness Engineering - context.py

## 问题背景

**焦虑检测**触发 Context Reset 后，Agent 得到干净的窗口，但：
- 丢失了所有工作记忆
- 不知道已完成什么
- 不知道下一步做什么
- 可能重复已完成的工作

**解决方案**：持久化 checkpoint 到 progress.md + 注入 git diff context。

## 实现细节

### 1. create_checkpoint()

**写入位置**：`{WORKSPACE}/progress.md`

**结构化 handoff 文档**：
```markdown
## Completed Work
(what was built, with file paths)

## Current State
(what works, what's broken right now)

## Next Steps
(exactly what to do next, in order)

## Key Decisions & Rationale
(why things were done this way)

## Known Issues
(bugs, incomplete features, technical debt)
```

**LLM summarization**：
- 输入：完整 messages 历史
- 输出：结构化 checkpoint（≤5000 chars）
- 持久化：progress.md

### 2. restore_from_checkpoint()

**注入 git diff context**：
```bash
git diff --stat HEAD~5 2>/dev/null || git log --oneline -5 2>/dev/null
```

**目的**：
- 显示最近5次提交的代码变更
- 让 Agent 知道当前代码状态
- 补充 checkpoint 可能遗漏的细节

**fresh messages**：
```
[
  {"role": "system", "content": system_prompt},
  {"role": "user", "content": "You are resuming an in-progress project...\n\n" + checkpoint + git_context + "\n\nContinue from where the previous session left off."}
]
```

## 对比 Harness Engineering

| 特性 | Harness | OpenClaw 当前状态 |
|------|---------|-------------------|
| progress.md 持久化 | ✅ create_checkpoint() | ⚠️ 缺失 |
| git diff context | ✅ restore_from_checkpoint() | ⚠️ 缺失 |
| 焦虑检测 | ✅ 9个模式 | ✅ 已实现 |
| Compaction | ✅ role-specific retention | ✅ 已实现 |
| Reset threshold | ✅ 150k tokens | ✅ 已实现 |

## 缺失影响

### 不持久化 progress.md：
- Agent reset 后重复已完成工作
- 丢失架构决策记忆
- 不知道下一步做什么

### 不注入 git diff：
- Agent 不知道最近代码变更
- 可能覆盖别人修改
- 缺少当前状态上下文

## 实现建议

### 创建 impl/bin/progress-persistence.js：

```javascript
/**
 * Progress Persistence - Context Reset 进度持久化
 * 来源：Harness Engineering - context.py
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROGRESS_FILE = 'progress.md';

/**
 * 创建 checkpoint 并持久化到 progress.md
 * @param {string} workspace - 工作目录
 * @param {string} messagesJson - messages JSON
 * @param {function} llmCall - LLM 调用函数
 * @returns {string} checkpoint
 */
function createCheckpoint(workspace, messagesJson, llmCall) {
  const messages = JSON.parse(messagesJson);
  
  // Flatten messages to text
  const text = messagesToText(messages);
  
  // LLM summarization
  const checkpoint = llmCall([
    {role: 'system', content: `You are creating a handoff document for the next agent session.
Structure the handoff as:
## Completed Work
## Current State
## Next Steps
## Key Decisions & Rationale
## Known Issues

Be thorough and specific — file paths, function names, error messages.`},
    {role: 'user', content: text}
  ]);
  
  // Persist to progress.md
  const progressPath = path.join(workspace, PROGRESS_FILE);
  fs.writeFileSync(progressPath, checkpoint, 'utf8');
  
  return checkpoint;
}

/**
 * 从 checkpoint 恢复，注入 git diff context
 * @param {string} checkpoint - checkpoint 内容
 * @param {string} systemPrompt - 系统提示
 * @param {string} workspace - 工作目录
 * @returns {Array} fresh messages
 */
function restoreFromCheckpoint(checkpoint, systemPrompt, workspace) {
  // Get git diff context
  let gitContext = '';
  try {
    const diffResult = execSync(
      'git diff --stat HEAD~5 2>/dev/null || git log --oneline -5 2>/dev/null',
      {cwd: workspace, encoding: 'utf8', timeout: 10000}
    );
    if (diffResult.trim()) {
      gitContext = `\n\nRecent code changes:\n\`\`\`\n${diffResult.trim().slice(0, 2000)}\n\`\`\``;
    }
  } catch (err) {
    // Git not available, skip
  }
  
  return [
    {role: 'system', content: systemPrompt},
    {role: 'user', content: `You are resuming an in-progress project. Your previous session's context was reset to give you a clean slate.

Here is the handoff document from the previous session:

${checkpoint}${gitContext}

Continue from where the previous session left off. Do NOT redo work that's already completed.`}
  ];
}

/**
 * Flatten messages to text
 */
function messagesToText(messages) {
  return messages.map(msg => {
    const role = msg.role || '?';
    let content = msg.content || '';
    if (Array.isArray(content)) {
      content = content.map(b => b.text || '').join(' ');
    }
    return `[${role}] ${content.slice(0, 3000)}`;
  }).join('\n');
}

module.exports = { createCheckpoint, restoreFromCheckpoint, PROGRESS_FILE };
```

### 集成到 context lifecycle：

在 impl/bin/context-lifecycle.js 中：
- compaction 前检查 progress.md 是否存在
- reset 后调用 restoreFromCheckpoint()
- 确保每次 reset 都注入 git diff context

---

创建时间：2026-04-17
来源：Harness Engineering context.py
状态：待实现