# Team Delete Tool Skill

团队删除工具 - Active member check + Cleanup registration + Color clear。

## 功能概述

从Claude Code的TeamDeleteTool提取的团队清理模式，用于OpenClaw的多agent协作。

## 核心机制

### Active Member Check

```typescript
const nonLeadMembers = teamFile.members.filter(m => m.name !== TEAM_LEAD_NAME)
const activeMembers = nonLeadMembers.filter(m => m.isActive !== false)

if (activeMembers.length > 0) {
  return {
    success: false,
    message: `Cannot cleanup team with ${activeMembers.length} active member(s): ${memberNames}. Use requestShutdown first.`
  }
}
// 有active teammate → 拒绝cleanup
// 必须先shutdown
```

### Cleanup Registration

```typescript
await cleanupTeamDirectories(teamName)
unregisterTeamForSessionCleanup(teamName)
// cleanupTeamDirectories → 删除文件
// unregister → 不再session结束时cleanup
```

### Color Clear

```typescript
clearTeammateColors()
// 新team从fresh开始
// 颜色分配重置
```

### Leader Team Name Clear

```typescript
clearLeaderTeamName()
// getTaskListId() falls back to session ID
// 解除Team=TaskList绑定
```

### AppState Clear

```typescript
setAppState(prev => ({
  ...prev,
  teamContext: undefined,
  inbox: { messages: [] }
}))
// 清空team context
// 清空inbox messages
```

### Analytics Event

```typescript
logEvent('tengu_team_deleted', { team_name })
// 删除时记录事件
```

## 实现建议

### OpenClaw适配

1. **activeCheck**: Active member检查
2. **cleanupDirs**: Cleanup directories
3. **colorClear**: 颜色清除
4. **appStateClear**: AppState清空

### 状态文件示例

```json
{
  "teamName": "research-squad",
  "activeMembers": 0,
  "cleanupSuccess": true,
  "colorsCleared": true
}
```

## 关键模式

### Active Member Gate

```
active teammates → reject → suggest requestShutdown
// 强制graceful shutdown
// 防止意外删除
```

### Cleanup + Unregister

```
cleanupTeamDirectories → unregisterTeamForSessionCleanup
// cleanup完成后取消注册
// 防止double cleanup
```

### Color Reset

```
clearTeammateColors → new team starts fresh
// 颜色分配从头开始
// 防止颜色冲突
```

### Inbox Clear

```
teamContext = undefined + inbox.messages = []
// 完全清空team状态
// 防止stale messages
```

## 借用价值

- ⭐⭐⭐⭐⭐ Active member gate pattern
- ⭐⭐⭐⭐ Cleanup + unregister pattern
- ⭐⭐⭐⭐ Color reset on team delete
- ⭐⭐⭐⭐ Inbox clear pattern

## 来源

- Claude Code: `tools/TeamDeleteTool/TeamDeleteTool.ts` (6KB+)
- 分析报告: P38-25