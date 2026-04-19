---
name: team-memory-sync-service-complete
description: "团队记忆同步服务完整性检查。验证团队记忆同步功能完整性，确保多人协作记忆共享。Use when checking team memory sync completeness."
---

# Team Memory Sync Service Complete

## 功能

验证团队记忆同步。

### 检查项

- sync机制完整性 - 同步流程完整
- 冲突处理能力 - 冲突检测解决
- 版本控制功能 - 版本管理能力
- 权限管理 - 访问权限控制

### 使用示例

```javascript
// 检查完整性
const result = checkTeamMemorySync();

// 返回结果
{
  syncEnabled: true,
  conflictHandler: ✅,
  versionControl: ✅,
  permissionManager: ✅,
  lastSyncTime: '2026-04-15T09:00:00Z'
}
```

### 同步类型

- 实时同步 - 即时更新
- 定时同步 - 定期批量
- 手动同步 - 用户触发

---

来源: Claude Code services/teamMemorySync.ts