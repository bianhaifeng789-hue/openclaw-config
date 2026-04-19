---
name: worktree-tools-complete
description: "Worktree工具完整性检查。验证Git worktree管理工具完整性，确保多分支并行开发功能正常。Use when checking worktree management tools."
---

# Worktree Tools Complete

## 功能

验证worktree工具完整性。

### 核心工具列表

- create_worktree - 创建新worktree
- list_worktrees - 列出所有worktree
- remove_worktree - 删除worktree
- prune_worktrees - 清理无效worktree

### 验证示例

```javascript
const result = checkWorktreeTools();

// 返回
{
  create_worktree: ✅,
  list_worktrees: ✅,
  remove_worktree: ✅,
  prune_worktrees: ✅
}
```

### Worktree优势

- 多分支并行开发
- 独立工作目录
- 快速分支切换
- 避免频繁stash

---

来源: Claude Code git/worktree.ts