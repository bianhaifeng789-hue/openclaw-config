---
name: undercover-mode
description: "Safety mode to prevent leaking internal information. Auto-detect public/private repo. Protect sensitive codenames, project names, commit message cleaning. Use when [undercover mode] is needed."
metadata:
  openclaw:
    emoji: "🔒"
    triggers: [public-repo, security-check]
    feishuCard: true
---

# Undercover Mode Skill - 隐身模式

保护敏感信息，防止在公开场合泄露内部内容。

## 为什么需要这个？

**场景**：
- 在公开群聊中讨论
- 处理公开项目
- 提交代码到公开仓库
- 防止泄露敏感信息

**Claude Code 方案**：undercover.ts + internal info protection
**OpenClaw 飞书适配**：飞书群聊场景 + 企业信息保护

---

## 保护内容

### 1. 模型 Codenames

```typescript
// 需要保护的模型代号
const MODEL_CODENAMES = [
  'Capybara',    // Claude 3.5 Sonnet
  'Tengu',       // Claude 4
  'Opus',        // Claude 4 Opus
  'Haiku',       // Claude 4 Haiku
  'Sonnet',      // Claude 4 Sonnet
  // ...更多内部代号
]

// 替换为公开名称
const PUBLIC_NAMES = {
  'Capybara': 'Claude',
  'Tengu': 'Claude',
  'Opus': 'Claude',
  'Haiku': 'Claude',
  'Sonnet': 'Claude'
}
```

### 2. 项目名称

```typescript
// 需要保护的内部项目名
const INTERNAL_PROJECTS = [
  'claude-code',
  'tengu',
  'capybara',
  // ...更多内部项目
]

// 检测并替换
function sanitizeProjectName(name: string): string {
  if (INTERNAL_PROJECTS.includes(name.toLowerCase())) {
    return 'our project'
  }
  return name
}
```

### 3. Commit Message 清理

```typescript
function sanitizeCommitMessage(message: string): string {
  // 移除 AI attribution
  message = message.replace(/Generated with Claude Code/gi, '')
  message = message.replace(/1-shotted by/gi, '')
  message = message.replace(/claude-\w+-\d+-\d+/gi, '')
  
  // 移除内部代号
  for (const codename of MODEL_CODENAMES) {
    message = message.replace(new RegExp(codename, 'gi'), 'Claude')
  }
  
  return message.trim()
}
```

---

## 自动检测

### Public/Private Repo 检测

```typescript
function detectRepoVisibility(): 'public' | 'private' | 'unknown' {
  // 检查 git remote
  const remote = getGitRemote()
  
  // GitHub public repo 检测
  if (remote.includes('github.com')) {
    const { owner, repo } = parseGitHubRepo(remote)
    const isPublic = checkGitHubRepoVisibility(owner, repo)
    return isPublic ? 'public' : 'private'
  }
  
  // Internal repo allowlist
  if (INTERNAL_REPO_ALLOWLIST.some(pattern => remote.match(pattern))) {
    return 'private'
  }
  
  return 'unknown'
}
```

---

## 飞书卡片格式

### Undercover Mode 启用卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🔒 Undercover Mode 已启用**\n\n**检测到公开环境**\n\n---\n\n**保护内容**：\n• 模型代号 → 替换为公开名称\n• 内部项目名 → 替换为通用名称\n• Commit message → 移除 AI attribution\n\n---\n\n**当前环境**：\n• **Repo**：public（GitHub）\n• **群聊**：公开群\n• **保护级别**：标准\n\n---\n\n**注意**：\n敏感信息将被自动替换，确保不会泄露内部内容"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 检测环境

```
Undercover Mode:
1. 检测 repo visibility
2. 检测群聊类型（公开/私有）
3. 判断是否需要启用 undercover
4. 发送飞书卡片通知
```

### 2. 应用保护

```typescript
function applyUndercoverProtection(content: string): string {
  if (!isUndercoverEnabled()) {
    return content
  }
  
  // 替换模型代号
  content = sanitizeModelCodenames(content)
  
  // 替换项目名
  content = sanitizeProjectNames(content)
  
  // 清理 commit message
  content = sanitizeCommitMessage(content)
  
  return content
}
```

---

## 持久化存储

```json
// memory/undercover-mode-state.json
{
  "enabled": false,
  "detections": [
    {
      "environment": "public-repo",
      "repo": "https://github.com/user/public-repo",
      "timestamp": "2026-04-12T00:00:00Z",
      "action": "enabled"
    }
  ],
  "stats": {
    "sanitizations": 0,
    "codenamesReplaced": 0,
    "projectsSanitized": 0,
    "commitMessagesCleaned": 0
  },
  "config": {
    "autoDetect": true,
    "notifyOnEnable": true,
    "protectedCodenames": ["Capybara", "Tengu", "Opus", "Haiku", "Sonnet"],
    "protectedProjects": ["claude-code", "tengu"]
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| isUndercover | 飞书群聊检测 |
| getUndercoverInstructions | 保护指令 |
| Internal repo allowlist | 企业内部 repo |
| Commit message cleaning | 同样需要 |
| Anthropic 内部保护 | 企业用户保护 |

---

## 注意事项

1. **自动检测**：根据环境自动启用
2. **飞书群聊**：公开群触发保护
3. **Commit message**：移除 AI attribution
4. **模型代号**：替换为公开名称
5. **项目名**：替换为通用名称

---

## 自动启用

此 Skill 在检测到公开环境时自动触发。

---

## 下一步增强

- 企业自定义保护内容
- 检测敏感关键词
- 日志分析（保护统计）
- 用户自定义 allowlist