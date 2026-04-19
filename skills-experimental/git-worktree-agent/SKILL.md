---
name: git-worktree-agent
description: |
  Git worktree support for isolated agent workspaces. Each agent gets its own worktree branch, preventing conflicts in parallel multi-agent work.
  
  Use when:
  - Multiple agents working on the same repo simultaneously
  - Need isolated branch per agent task
  - Parallel feature development without conflicts
  - Agent needs clean working directory
  
  Keywords: worktree, git branch, isolated workspace, parallel agents, multi-agent git
metadata:
  openclaw:
    emoji: "🌿"
    source: claude-code-worktree
    triggers: [worktree, multi-agent-git, isolated-branch, parallel-dev]
    priority: P2
---

# Git Worktree Agent Support

基于 Claude Code `worktree.ts` 的 git worktree 隔离工作区，适配多 agent 并行开发场景。

## 核心概念（来自 Claude Code）

### WorktreeSession 结构
```typescript
type WorktreeSession = {
  originalCwd: string        // 主仓库路径
  worktreePath: string       // worktree 路径
  worktreeName: string       // worktree 名称（slug）
  worktreeBranch?: string    // worktree 分支名
  originalBranch?: string    // 主仓库原始分支
  sessionId: string          // 关联的 session ID
  tmuxSessionName?: string   // tmux session 名（可选）
  creationDurationMs?: number
}
```

### Slug 命名规则
```
格式: [a-zA-Z0-9._-]，每段不超过 64 字符
示例: "feature-auth", "fix-bug-123", "agent-task-abc"
分支名: worktrees/<slug>
路径: <repo>/../<repo>-worktrees/<slug>
```

### 关键操作

**createAgentWorktree(slug)**:
```
1. 验证 slug 格式
2. git worktree add <path> -b worktrees/<slug>
3. 软链接 node_modules（避免磁盘膨胀）
4. 复制 .claude/ 配置文件
5. 返回 worktreePath
```

**removeAgentWorktree(slug)**:
```
1. git worktree remove <path> --force
2. git branch -D worktrees/<slug>
3. 清理残留文件
```

**cleanupStaleAgentWorktrees()**:
```
扫描所有 worktrees/<slug> 分支
如果对应 session 已结束 → 删除 worktree
```

## OpenClaw 适配实现

### 创建 Agent Worktree

```bash
# 为 agent 任务创建隔离 worktree
create_agent_worktree() {
  local slug=$1
  local repo_root=$(git rev-parse --show-toplevel)
  local worktree_path="${repo_root}/../$(basename $repo_root)-worktrees/${slug}"
  local branch="worktrees/${slug}"
  
  # 创建 worktree
  git worktree add "$worktree_path" -b "$branch"
  
  # 软链接 node_modules（避免重复安装）
  if [ -d "$repo_root/node_modules" ]; then
    ln -s "$repo_root/node_modules" "$worktree_path/node_modules"
  fi
  
  echo "$worktree_path"
}
```

### 状态文件
```json
// memory/worktree-sessions.json
{
  "sessions": [
    {
      "slug": "feature-auth",
      "worktreePath": "/path/to/repo-worktrees/feature-auth",
      "branch": "worktrees/feature-auth",
      "agentId": "agent-123",
      "createdAt": "2026-04-13T18:00:00+08:00",
      "status": "active"
    }
  ]
}
```

### 使用场景

```
用户: "用两个 agent 并行实现登录和注册功能"

1. 创建 worktree: worktrees/feature-login
2. 创建 worktree: worktrees/feature-register
3. Agent A 在 feature-login worktree 工作
4. Agent B 在 feature-register worktree 工作
5. 完成后 PR merge，清理 worktrees
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| tmux 集成 | 每个 worktree 独立 tmux session | 不需要（无 TUI） |
| sparse-checkout | 支持 sparsePaths 配置 | 不实现 |
| 自动清理 | session 结束自动清理 | heartbeat 定期清理 |
| 钩子 | worktreeCreate/Remove hooks | 不实现 |
