# Security Review Command Skill

安全审查命令 - Frontmatter配置 + Shell execution in prompt。

## 功能概述

从Claude Code的security-review.ts提取的安全审查模式，用于OpenClaw的代码安全分析。

## 核心机制

### Frontmatter配置

```yaml
---
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git show:*), Bash(git remote show:*), Read, Glob, Grep, LS, Task
description: "Complete a security review of the pending changes on the current branch Use when [security review command] is needed."
---
```

### Shell Execution in Prompt

```markdown
GIT STATUS:

\`\`\`
!\`git status\`
\`\`\`

FILES MODIFIED:

\`\`\`
!\`git diff --name-only origin/HEAD...\`
\`\`\`
```

`!\`command\`` syntax executes shell and embeds output。

### 安全类别

**Input Validation**:
- SQL injection, Command injection, XXE, Template injection, NoSQL injection, Path traversal

**Authentication & Authorization**:
- Auth bypass, Privilege escalation, Session flaws, JWT vulnerabilities

**Crypto & Secrets**:
- Hardcoded secrets, Weak crypto, Improper key storage

**Injection & Code Execution**:
- RCE via deserialization, Pickle injection, YAML vulns, Eval injection, XSS

**Data Exposure**:
- Sensitive data logging, PII handling violations, API leakage

### 分析方法论

```
Phase 1: Repository Context Research（file search）
Phase 2: Comparative Analysis（diff review）
Phase 3: Finding Synthesis（prioritize by severity）
```

### CRITICAL INSTRUCTIONS

```
1. MINIMIZE FALSE POSITIVES: Only flag >80% confident exploitable
2. AVOID NOISE: Skip theoretical issues, style concerns
3. FOCUS ON IMPACT: Prioritize real exploitation potential
4. EXCLUSIONS: NO DOS, NO secrets on disk, NO rate limiting
```

## 实现建议

### OpenClaw适配

1. **frontmatter**: allowed-tools + description
2. **shell exec**: !\`command\` syntax
3. **categories**: 定义安全检查类别
4. **minimize FP**: 高置信度阈值

### 状态文件示例

```json
{
  "allowedTools": ["Bash(git:*)", "Read", "Grep"],
  "categories": ["input_validation", "auth", "crypto", "injection", "data_exposure"],
  "confidenceThreshold": 0.8
}
```

## 关键模式

### Frontmatter Tool Restriction

```yaml
allowed-tools: Bash(git diff:*), Read, Glob, Grep
# 限制安全审查只读操作
```

### Shell Embedding

```markdown
!\`git diff origin/HEAD...\`
// 执行git diff并嵌入输出
// 动态内容，每次运行最新
```

### Confidence Threshold

```
Only flag issues where >80% confident
// 避免噪音，提高审查质量
```

## 借用价值

- ⭐⭐⭐⭐⭐ Shell execution in prompt
- ⭐⭐⭐⭐ Frontmatter tool restriction
- ⭐⭐⭐⭐ Minimize false positives原则
- ⭐⭐⭐ Security categories分类

## 来源

- Claude Code: `commands/security-review.ts`
- 分析报告: P35-2