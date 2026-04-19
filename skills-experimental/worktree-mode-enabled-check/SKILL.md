---
name: worktree-mode-enabled-check
description: "Worktree模式检查。检查是否启用Git worktree模式，验证多分支并行开发环境。Use when checking if worktree mode is active."
---

# Worktree Mode Enabled Check

## 功能

检查worktree模式状态。

### 检查项

- 是否在worktree目录中
- worktree路径有效性
- 当前分支名称
- 主worktree关联

### 使用示例

```javascript
// 检查模式
const status = checkWorktreeMode();

// 返回状态
{
  enabled: true,
  path: '/path/to/worktree',
  branch: 'feature-branch',
  mainWorktree: '/path/to/main',
  isLinked: true
}
```

### Worktree优势

- 多分支并行开发
- 独立工作目录
- 无需频繁切换
- 避免stash操作

---

来源: Claude Code git/worktreeCheck.ts