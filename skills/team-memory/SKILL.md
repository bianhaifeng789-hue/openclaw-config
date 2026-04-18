---
name: team-memory
description: "团队记忆共享，支持私人/团队记忆分离和类型分类 Use when [team memory] is needed."
triggers:
  - team
  - memory
  - 团队记忆
  - 记忆共享
  - 私人记忆
---

# Team Memory Service

团队记忆共享，借鉴 Claude Code 的 teamMemPaths 模块。

## 功能

- **路径管理**: 私人记忆路径和团队记忆路径分离
- **记忆类型**: 四种类型（user/feedback/project/reference）
- **Scope 分类**: private（私人）或 team（团队共享）
- **路径安全**: 防止路径遍历攻击
- **索引构建**: MEMORY.md 入口点管理

## 记忆类型

| 类型 | Scope | 说明 |
|------|-------|------|
| **user** | private | 用户偏好、个人上下文 |
| **feedback** | team | 团队反馈、经验教训 |
| **project** | team | 项目进展、里程碑 |
| **reference** | team | 参考资料、最佳实践 |

## 使用场景

- 多用户共享记忆
- 团队知识库构建
- 私人偏好与团队知识分离

## API

```typescript
import { teamMemoryService, MemoryType } from './team-memory-service';

// 检查团队记忆是否启用
if (teamMemoryService.isEnabled()) {
  // 创建记忆条目
  const entry = teamMemoryService.createEntry(
    '项目决策',
    '关于架构的关键决策',
    'project', // 类型
    '采用 TypeScript 作为主要语言...',
  );
  
  // 获取路径
  const privatePath = teamMemoryService.getPrivatePath();
  const teamPath = teamMemoryService.getTeamPath();
  
  // 构建索引
  const entries = [entry];
  const indexContent = teamMemoryService.buildIndex(entries);
}
```

## Frontmatter 格式

```markdown
---
name: 记忆标题
description: 一行摘要
type: user | feedback | project | reference
created: 2026-04-14T00:00:00Z
updated: 2026-04-14T00:00:00Z
---

记忆内容...
```

## Stats

- entriesCreated: 创建的条目数
- indicesBuilt: 构建的索引数

## 文件

- `impl/utils/team-memory-service.ts`