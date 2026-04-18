# Team Create Tool Skill

团队创建工具 - Unique name generation + Session cleanup + TaskList binding。

## 功能概述

从Claude Code的TeamCreateTool提取的agent团队创建模式，用于OpenClaw的多agent协作。

## 核心机制

### Unique Name Generation

```typescript
function generateUniqueTeamName(providedName: string): string {
  if (!readTeamFile(providedName)) return providedName
  return generateWordSlug()  // Team exists → generate slug
}
// 已存在 → 自动生成新名字
// 不失败
```

### One Team Per Leader

```typescript
if (existingTeam) {
  throw new Error(`Already leading team "${existingTeam}". A leader can only manage one team. Use TeamDelete first.`)
}
// 限制一个leader一个team
// 防止混乱
```

### Session Cleanup Registration

```typescript
await writeTeamFileAsync(finalTeamName, teamFile)
registerTeamForSessionCleanup(finalTeamName)
// Session结束时cleanup
// 防止遗留文件
```

### TaskList Binding

```typescript
const taskListId = sanitizeName(finalTeamName)
await resetTaskList(taskListId)
await ensureTasksDir(taskListId)
setLeaderTeamName(sanitizeName(finalTeamName))
// Team = Project = TaskList
// Team创建 → 新TaskList
```

### Team File Structure

```typescript
const teamFile: TeamFile = {
  name: finalTeamName,
  createdAt: Date.now(),
  leadAgentId,
  leadSessionId: getSessionId(),
  members: [{
    agentId: leadAgentId,
    name: TEAM_LEAD_NAME,
    agentType: leadAgentType,
    model: leadModel,
    joinedAt: Date.now(),
    cwd: getCwd()
  }]
}
// Team文件结构
// 包含lead member
```

### AppState Team Context

```typescript
setAppState(prev => ({
  ...prev,
  teamContext: {
    teamName: finalTeamName,
    teamFilePath,
    leadAgentId,
    teammates: {
      [leadAgentId]: {
        name: TEAM_LEAD_NAME,
        color: assignTeammateColor(leadAgentId),
        cwd: getCwd()
      }
    }
  }
}))
// AppState存储team context
// teammates映射
```

### Agent ID Format

```typescript
const leadAgentId = formatAgentId(TEAM_LEAD_NAME, finalTeamName)
// Deterministic ID: "team-lead@teamName"
// 可推导
```

### No ENV Agent ID

```typescript
// Note: We intentionally don't set CLAUDE_CODE_AGENT_ID for team lead because:
// 1. Lead is not a "teammate" - isTeammate() should return false
// 2. Their ID is deterministic and can be derived
// 3. Setting it would break inbox polling
// Team name in AppState.teamContext, not process.env
// Lead不设置agent ID
// 区分teammate和lead
```

## 实现建议

### OpenClaw适配

1. **uniqueName**: 自动唯一命名
2. **oneTeam**: 一leader一team限制
3. **cleanup**: Session cleanup
4. **taskList**: TaskList绑定

### 状态文件示例

```json
{
  "teamName": "research-squad",
  "leadAgentId": "team-lead@research-squad",
  "taskListId": "research-squad",
  "cleanupRegistered": true
}
```

## 关键模式

### Auto Unique Name

```
Name exists → generateWordSlug() → new unique name
// 不失败
// 自动解决冲突
```

### Team = TaskList

```
Team create → resetTaskList + ensureTasksDir + setLeaderTeamName
// 绑定TaskList
// 任务编号从1开始
```

### One Team Restriction

```
Already leading → throw error → suggest TeamDelete
// 强制一个team
// 防止资源混乱
```

### Lead ≠ Teammate

```
No CLAUDE_CODE_AGENT_ID for lead → isTeammate() returns false → inbox polling works
// Lead身份区分
// 不影响inbox
```

## 借用价值

- ⭐⭐⭐⭐⭐ Auto unique name generation
- ⭐⭐⭐⭐⭐ Team = TaskList binding
- ⭐⭐⭐⭐ One team restriction
- ⭐⭐⭐⭐ Session cleanup registration
- ⭐⭐⭐⭐ Lead ≠ Teammate identity

## 来源

- Claude Code: `tools/TeamCreateTool/TeamCreateTool.ts` (8KB+)
- 分析报告: P38-20