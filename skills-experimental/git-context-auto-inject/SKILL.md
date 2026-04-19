---
name: git-context-auto-inject
description: |
  Automatically inject Git context into system prompt for better code awareness.
  
  Use when:
  - System needs current Git state
  - Code context needs branch info
  - User working in Git repository
  - Automatic Git status awareness
  
  NOT for:
  - Non-Git projects
  - User explicitly disables
  - Privacy-sensitive repos
  
  Auto-trigger conditions:
  - Automatically at session start
  - Periodic refresh via heartbeat
  
  Injected context:
  - Current branch
  - Default branch (main/master)
  - Git status (modified, added, deleted)
  - Recent commits (last 5)
  - User name
  
  Keywords:
  - Internal service - auto-activated at session start
metadata:
  openclaw:
    emoji: "🌿"
    source: claude-code-core
    triggers: [system-internal]
    priority: P1
    autoTrigger: true
    userAccessible: false
---

# Git Context Auto-Inject

Git上下文自动注入。

## 注入内容

### Branch信息
```xml
<git_context>
  <current_branch>feature/openclaw-integration</current_branch>
  <default_branch>main</default_branch>
  <status>
    M src/index.ts
    A src/utils/new.ts
    D src/old.ts
  </status>
</git_context>
```

### Commit历史
```xml
<recent_commits>
  <commit hash="abc123">Add OpenClaw integration</commit>
  <commit hash="def456">Fix memory leak</commit>
  <commit hash="ghi789">Update dependencies</commit>
</recent_commits>
```

### 用户信息
```xml
<git_user>John Doe</git_user>
```

## 实现逻辑

```typescript
async function getGitContext(): Promise<string> {
  const [branch, mainBranch, status, log, userName] = await Promise.all([
    getBranch(),
    getDefaultBranch(),
    exec('git status --short'),
    exec('git log --oneline -n 5'),
    exec('git config user.name')
  ])
  
  return formatGitContext({ branch, mainBranch, status, log, userName })
}
```

## 刷新时机

- 会话开始时自动获取
- 每30分钟刷新（HEARTBEAT）
- 用户切换分支后

---

来源: Claude Code context.ts