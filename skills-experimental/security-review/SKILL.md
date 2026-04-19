---
name: security-review
description: "Security-focused code review of pending changes. Identify high-confidence vulnerabilities: SQL injection, command injection, auth bypass, hardcoded secrets. Minimize false positives. Use when [security review] is needed."
metadata:
  openclaw:
    emoji: "🔒"
    triggers: [security-check, pr-review]
    feishuCard: true
---

# Security Review Skill - 安全审查

专注于安全漏洞的代码审查，最小化 false positives。

## 为什么需要这个？

**场景**：
- PR 安全审查
- 代码变更安全检查
- 漏洞识别
- 安全最佳实践验证

**Claude Code 方案**：Markdown 模板驱动
**OpenClaw 飞书适配**：飞书卡片安全报告

---

## 安全类别

### 1. Input Validation Vulnerabilities

- **SQL Injection**：未 sanitized 用户输入
- **Command Injection**：system calls, subprocesses
- **XXE Injection**：XML parsing
- **Template Injection**：templating engines
- **NoSQL Injection**：database queries
- **Path Traversal**：file operations

### 2. Authentication & Authorization Issues

- **Authentication Bypass**：绕过认证逻辑
- **Privilege Escalation**：权限提升路径
- **Session Management**：会话管理缺陷
- **JWT Vulnerabilities**：JWT token 问题
- **Authorization Bypasses**：授权逻辑绕过

### 3. Crypto & Secrets Management

- **Hardcoded Secrets**：硬编码 API keys, passwords, tokens
- **Weak Crypto**：弱加密算法
- **Improper Key Storage**：密钥存储不当
- **Certificate Bypasses**：证书验证绕过

### 4. Injection & Code Execution

- **RCE via Deserialization**：反序列化 RCE
- **Pickle Injection**：Python pickle 注入
- **YAML Deserialization**：YAML 反序列化漏洞
- **Eval Injection**：动态代码执行注入

---

## 关键要求

### MINIMIZE FALSE POSITIVES

**要求**：
- 只报告 >80% 确信度的漏洞
- 跳过理论性问题
- 只关注实际可利用的漏洞

### EXCLUSIONS（不报告）

- DOS 漏洞（即使可利用）
- Disk secrets（由其他流程处理）
- Rate limiting 问题
- Resource exhaustion

---

## 飞书卡片格式

### 安全审查卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔒 安全审查报告**\n\n**审查范围**：当前分支 pending changes\n\n**审查结果**：\n\n🔴 **高危漏洞**（1 个）：\n\n**#1 - Command Injection**\n• **文件**：`src/utils/shell.ts:42`\n• **代码**：`exec(userInput)`\n• **问题**：用户输入未 sanitized 直接执行\n• **修复**：使用 `shellQuote()` 或白名单验证\n\n---\n\n🟡 **中危问题**（2 个）：\n\n**#2 - Hardcoded Secret**\n• **文件**：`src/config.ts:10`\n• **代码**：`API_KEY = 'sk-xxx'`\n• **修复**：移到环境变量\n\n**#3 - Weak Crypto**\n• **文件**：`src/auth.ts:15`\n• **代码**：`MD5(password)`\n• **修复**：使用 bcrypt 或 SHA-256+\n\n---\n\n✅ **审查通过**：5 个文件无安全问题"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "修复漏洞"},
          "type": "primary",
          "value": {"action": "fix_vulnerabilities"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "查看 Diff"},
          "type": "default",
          "value": {"action": "view_diff"}
        }
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 获取变更内容

```
Security Review:
1. git status（获取修改文件）
2. git diff origin/HEAD...（获取 diff）
3. git log origin/HEAD...（获取 commits）
```

### 2. 安全审查

```
Agent:
1. 解析 diff 内容
2. 检查安全类别：
   - Input Validation
   - Auth & Authorization
   - Crypto & Secrets
   - Injection & RCE
3. 评估漏洞可信度（>80%）
4. 生成安全报告
```

### 3. 生成报告

```
Agent:
1. 分类漏洞（高危/中危/低危）
2. 提供修复建议
3. 发送飞书卡片报告
```

---

## Markdown 模板（Claude Code）

```markdown
---
allowed-tools: Bash(git diff:*), Bash(git status:*), Read, Glob, Grep
---

OBJECTIVE:
Perform a security-focused code review to identify HIGH-CONFIDENCE vulnerabilities.

CRITICAL INSTRUCTIONS:
1. MINIMIZE FALSE POSITIVES: Only flag issues where you're >80% confident
2. AVOID NOISE: Skip theoretical issues
3. FOCUS ON IMPACT: Prioritize unauthorized access, data breaches
4. EXCLUSIONS: Do NOT report DOS, disk secrets, rate limiting

SECURITY CATEGORIES:
- Input Validation (SQL injection, command injection, XXE, path traversal)
- Auth & Authorization (bypass, escalation, session flaws)
- Crypto & Secrets (hardcoded secrets, weak crypto)
- Injection & RCE (deserialization, pickle, eval)
```

---

## 持久化存储

```json
// memory/security-review-state.json
{
  "reviewsPerformed": [
    {
      "id": "review-1",
      "branch": "feature/auth",
      "filesReviewed": 5,
      "vulnerabilitiesFound": 3,
      "highConfidence": 1,
      "mediumConfidence": 2,
      "timestamp": "2026-04-11T23:00:00Z"
    }
  ],
  "stats": {
    "reviewsPerformed": 0,
    "vulnerabilitiesFound": 0,
    "vulnerabilitiesFixed": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| Markdown 模板 | Skill 定义 |
| allowed-tools | 同样限制工具 |
| Terminal UI | 飞书卡片报告 |
| git diff 命令 | exec + git |

---

## 注意事项

1. **最小化 false positives**：>80% 确信度
2. **专注安全**：只检查安全漏洞
3. **排除 DOS**：不报告 DOS 漏洞
4. **提供修复建议**：每个漏洞给出修复方案
5. **优先级排序**：高危 > 中危 > 低危

---

## 自动启用

此 Skill 在用户请求安全审查或 PR review 时自动触发。

---

## 下一步增强

- 自动修复建议（代码 patch）
- 安全审查历史
- CWE 编号关联
- 安全最佳实践建议