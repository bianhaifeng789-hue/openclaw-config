---
name: permission-system
description: "Permission System - Enhanced permission management with dangerous pattern detection, command classification, and decision tracking. Reduces repetitive permission prompts. Use when [permission system] is needed."
metadata:
  openclaw:
    emoji: "🔒"
    triggers: [permission-check, dangerous-command, auto-mode]
    priority: high
    imports:
      - impl/utils/permission-utils.ts
---

# Permission System Skill

增强的权限管理系统 - 智能检测危险操作，学习用户偏好。

## 为什么需要

**问题**：
- OpenClaw 权限系统相对简单
- 用户频繁收到权限确认请求（重复询问）
- 缺少危险命令智能检测
- 无法学习用户偏好

**解决**：
- 借鉴 Claude Code 的完整 permissions 系统
- 危险模式检测（识别危险命令）
- 命令分类（安全/危险）
- 决策追踪（学习用户偏好）

---

## 核心模块

### 1. Dangerous Patterns (危险模式检测)

检测 20+ 种危险命令模式：

| 类别 | 示例 | 危险等级 |
|-----|-----|---------|
| 文件删除 | `rm -rf` | critical |
| 系统修改 | `sudo dd` | critical |
| 网络操作 | `curl \| bash` | critical |
| Git 操作 | `git reset --hard` | dangerous |
| 数据库 | `DROP DATABASE` | critical |

**危险等级**：
- `safe` - 安全操作
- `caution` - 需要注意
- `dangerous` - 危险操作
- `critical` - 极危险（禁止）

### 2. Command Classifier (命令分类)

分类 Bash 命令：

| 类别 | 说明 | 自动模式允许 |
|-----|-----|------------|
| `read` | 只读操作（ls, cat） | ✅ |
| `write` | 写入操作（mkdir, mv） | ✅ |
| `execute` | 执行代码（node, python） | ✅ |
| `network` | 网络操作（curl, ssh） | ❌ |
| `system` | 系统操作（sudo, chmod） | ❌ |
| `dangerous` | 危险操作（dd, mkfs） | ❌ |
| `git` | Git 操作 | ✅ 部分 |
| `npm` | npm/yarn/pnpm | ✅ |
| `docker` | Docker 操作 | ✅ 部分 |

### 3. Decision Tracker (决策追踪)

追踪用户的权限决策：

**学习规则**：
- 连续 5 次允许 → `always_allow`（置信度 0.7+）
- 连续 3 次拒绝 → `always_deny`（置信度 0.6+）
- 否则 → `ask`（需要询问）

**应用**：
- 避免重复询问相同类型的操作
- 自动调整权限策略
- 生成用户偏好报告

---

## 使用方式

### 1. 分析命令

```typescript
import { analyzeCommandForPermission } from './permission-utils'

// 分析命令
const analysis = analyzeCommandForPermission('rm -rf node_modules')

console.log('分类:', analysis.classification.category)      // 'dangerous'
console.log('风险:', analysis.dangerAnalysis.riskScore)      // 80
console.log('建议:', analysis.recommendation.action)         // 'forbidden'
console.log('原因:', analysis.recommendation.reason)         // '极危险操作'
```

### 2. 运行决策流程

```typescript
import { runPermissionDecisionFlow } from './permission-utils'

// 运行完整流程
const result = runPermissionDecisionFlow('npm install')

console.log('流程:', result.flows)           // 决策流程记录
console.log('最终决策:', result.finalDecision) // 'allow_always'
console.log('分析:', result.analysis)        // 详细分析
```

### 3. 快速检查

```typescript
import { isCommandDangerous, isCommandSafe } from './permission-utils'

// 快速检查
if (isCommandDangerous('git reset --hard')) {
  // 需要确认
}

if (isCommandSafe('ls -la')) {
  // 自动执行
}
```

### 4. 学习偏好

```typescript
import { learnPreference, shouldAutoApprove } from './permission-utils'

// 学习偏好
const preference = learnPreference('npm')

console.log('策略:', preference.learnedPolicy)  // 'always_allow'
console.log('置信度:', preference.confidence)    // 0.8

// 应用
if (shouldAutoApprove('npm')) {
  // 自动批准 npm 操作
}
```

---

## 借鉴 Claude Code

| Claude Code | OpenClaw |
|-------------|----------|
| `permissions/dangerousPatterns.ts` | `dangerous-patterns.ts` |
| `permissions/bashClassifier.ts` | `bash-command-classifier.ts` |
| `permissions/denialTracking.ts` | `permission-decision-tracker.ts` |
| `permissions/permissionExplainer.ts` | `permission-utils.ts` |

---

## 决策流程

```
1. 危险模式检测
   ↓ (极危险 → forbidden)
2. 命令分类
   ↓ (dangerous → deny)
3. 用户偏好检查
   ↓ (always_allow → auto_approve)
   ↓ (always_deny → auto_deny)
4. 综合决策
   ↓ (低风险 → auto_allow)
   ↓ (需确认 → ask_user)
```

---

## 飞书卡片

```typescript
import { createFeishuPermissionCard } from './permission-utils'

// 创建审批卡片
const card = createFeishuPermissionCard(analysis)

await message({ action: 'send', card })
```

卡片内容：
```
⚠️ 权限审批

命令: rm -rf node_modules
分类: dangerous
风险: 80/100
建议: 命令包含极危险模式（不可逆）
危险模式: rm_recursive, rm_force
❌ 禁止执行
```

---

## Post-Sampling Hook 整合

```typescript
import { createPermissionDecisionHook } from './permission-utils'
import { registerPostSamplingHook } from './post-sampling-hooks'

// 注册追踪 hook
registerPostSamplingHook(
  createPermissionDecisionHook(),
  { name: 'permission_tracking', priority: 10 }
)
```

每次采样后自动：
- 追踪权限决策
- 更新统计
- 学习偏好
- 保存状态

---

## 配置

```yaml
permissionSystem:
  enabled: true
  autoApproveThreshold: 5    # 连续允许次数阈值
  autoDenyThreshold: 3       # 连续拒绝次数阈值
  criticalAction: 'forbidden' # 极危险操作处理方式
  trackDecisions: true       # 是否追踪决策
  maxRecords: 1000           # 最大记录数
```

---

## 状态追踪

```json
{
  "globalDenialCount": 5,
  "lastDenialTimestamp": 1703275200,
  "decisionCount": 120,
  "operationStats": {
    "npm": { "allow": 50, "deny": 2 },
    "git": { "allow": 30, "deny": 5 },
    "read": { "allow": 40, "deny": 0 }
  }
}
```

---

## 安全建议

对于危险操作，系统会建议安全替代：

| 危险操作 | 安全替代 |
|---------|---------|
| `rm` | `trash`（可恢复） |
| `git reset --hard` | `git stash && git reset` |
| `curl \| bash` | `curl > script.sh && less && bash` |
| `sudo` | 检查是否需要 sudo |

---

## 注意事项

1. **极危险操作**：直接禁止，不询问
2. **最近拒绝**：如果有最近拒绝，需要更谨慎
3. **置信度阈值**：`always_allow` 需要 ≥0.7，`always_deny` 需要 ≥0.6
4. **记录限制**：最多保留 1000 条记录
5. **状态持久化**：定期保存到 `memory/permission-decision-state.json`

---

## 代码位置

- `impl/utils/dangerous-patterns.ts` - 危险模式检测
- `impl/utils/bash-command-classifier.ts` - 命令分类
- `impl/utils/permission-decision-tracker.ts` - 决策追踪
- `impl/utils/permission-utils.ts` - 统一入口
- `impl/utils/post-sampling-hooks.ts` - Hook 系统

---

## 参考资料

- Claude Code: `src/permissions/dangerousPatterns.ts`
- Claude Code: `src/permissions/bashClassifier.ts`
- Claude Code: `src/permissions/denialTracking.ts`
- Claude Code: `src/utils/hooks/postSamplingHooks.ts`