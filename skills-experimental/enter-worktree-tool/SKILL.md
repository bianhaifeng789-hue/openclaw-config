# Enter Worktree Tool Skill

Worktree切换工具 - Canonical root + Cache clear + State persistence。

## 功能概述

从Claude Code的EnterWorktreeTool提取的worktree模式，用于OpenClaw的repo隔离。

## 核心机制

### Canonical Root Resolution

```typescript
const mainRepoRoot = findCanonicalGitRoot(getCwd())
if (mainRepoRoot && mainRepoRoot !== getCwd()) {
  process.chdir(mainRepoRoot)
  setCwd(mainRepoRoot)
}
// 从当前worktree定位到main repo
// 确保worktree creation正确
```

### Worktree Creation

```typescript
const worktreeSession = await createWorktreeForSession(getSessionId(), slug)
process.chdir(worktreeSession.worktreePath)
setCwd(worktreeSession.worktreePath)
// 创建并切换到worktree
// Session绑定
```

### Cache Clear

```typescript
clearSystemPromptSections()
clearMemoryFileCaches()
getPlansDirectory.cache.clear?.()
// 清除所有cwd-dependent缓存
// 避免stale context
```

### State Persistence

```typescript
setOriginalCwd(getCwd())
saveWorktreeState(worktreeSession)
// 持久化worktree状态
// 支持exit恢复
```

### Validation

```typescript
z.string().superRefine((s, ctx) => {
  try {
    validateWorktreeSlug(s)  // letters, digits, dots, dashes, /
  } catch (e) {
    ctx.addIssue({ code: 'custom', message: e.message })
  }
})
// Slug格式验证
// 安全命名
```

## 实现建议

### OpenClaw适配

1. **canonicalRoot**: 主repo定位
2. **creation**: Worktree创建
3. **cacheClear**: 缓存清理
4. **persistence**: 状态持久化

### 状态文件示例

```json
{
  "worktreePath": "/tmp/worktree_feature-x",
  "worktreeBranch": "feature-x",
  "previousCwd": "/Users/mac/project",
  "systemPromptCleared": true
}
```

## 关键模式

### Canonical Root Resolution

```
findCanonicalGitRoot → main repo → create worktree
// 从任意worktree定位main
// 避免嵌套worktree
```

### Cache Cascade Clear

```
systemPrompt → memory → plans
// 所有依赖cwd的缓存
// 一次性清理
```

### Session Binding

```
sessionId → worktreeSession
// 每个session一个worktree
// ExitWorktree恢复
```

## 借用价值

- ⭐⭐⭐⭐⭐ Canonical root resolution
- ⭐⭐⭐⭐⭐ Cache cascade clear
- ⭐⭐⭐⭐⭐ Session binding
- ⭐⭐⭐⭐ Slug validation

## 来源

- Claude Code: `tools/EnterWorktreeTool/EnterWorktreeTool.ts`
- 分析报告: P38-8