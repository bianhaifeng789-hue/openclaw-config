# Commit Command Skill

Git提交命令 - Allowed tools限制 + Shell execution + Attribution。

## 功能概述

从Claude Code的commit.ts提取的提交模式，用于OpenClaw的Git操作。

## 核心机制

### Allowed Tools

```typescript
const ALLOWED_TOOLS = [
  'Bash(git add:*)',
  'Bash(git status:*)',
  'Bash(git commit:*)',
]
// 只允许git add/status/commit
```

### Prompt内容

```typescript
function getPromptContent(): string {
  const { commit: commitAttribution } = getAttributionTexts()
  
  return `
## Context
- Current git status: !\`git status\`
- Current git diff: !\`git diff HEAD\`
- Current branch: !\`git branch --show-current\`
- Recent commits: !\`git log --oneline -10\`

## Git Safety Protocol
- NEVER update git config
- NEVER skip hooks (--no-verify)
- ALWAYS create NEW commits（no --amend）
- Do not commit secrets
- No empty commits
- No -i flags（interactive）

## Your task
1. Analyze changes and draft commit message
2. Stage and commit using HEREDOC:
\`\`\`
git commit -m "$(cat <<'EOF'
Commit message here.
${commitAttribution ? `\n\n${commitAttribution}` : ''}
EOF
)"
\`\`\`
  `
}
```

### Shell Execution

```typescript
const finalContent = await executeShellCommandsInPrompt(
  promptContent,
  context,
  '/commit'
)
// !\`command\`语法执行并替换
```

### Attribution

```typescript
const { commit: commitAttribution } = getAttributionTexts()
// 可选：添加co-authored-by等attribution
```

### Undercover Mode

```typescript
if (isUndercover()) {
  prefix = getUndercoverInstructions() + '\n'
}
// 特殊模式添加额外指令
```

## 实现建议

### OpenClaw适配

1. **allowedTools**: git操作白名单
2. **shell exec**: !\`command\`处理
3. **safety protocol**: Git安全规则
4. **HEREDOC**: 正确的commit message格式

### 状态文件示例

```json
{
  "allowedTools": ["Bash(git add:*)", "Bash(git status:*)", "Bash(git commit:*)"],
  "safetyProtocol": {
    "noConfigUpdate": true,
    "noSkipHooks": true,
    "noAmend": true,
    "noSecrets": true
  },
  "attribution": "Co-authored-by: Claude <noreply@anthropic.com>"
}
```

## 关键模式

### Tool Restriction

```typescript
allowedTools: ALLOWED_TOOLS
// 命令级别的工具限制
// 比global限制更精细
```

### HEREDOC Commit

```bash
git commit -m "$(cat <<'EOF'
Message here
EOF
)"
// 正确处理多行commit message
// 避免shell escaping问题
```

### Dynamic Context

```markdown
- Current git status: !\`git status\`
// 动态获取当前状态
// 每次执行都是最新
```

## 借用价值

- ⭐⭐⭐⭐⭐ Allowed tools白名单
- ⭐⭐⭐⭐⭐ Shell execution in prompt
- ⭐⭐⭐⭐⭐ Git safety protocol
- ⭐⭐⭐⭐ HEREDOC commit格式
- ⭐⭐⭐ Attribution支持

## 来源

- Claude Code: `commands/commit.ts`
- 分析报告: P35-4