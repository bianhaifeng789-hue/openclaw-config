---
name: task-tools-complete
description: "任务工具完整性检查。验证任务管理工具完整性，确保任务操作正常。Use when checking task tool completeness."
---

# Task Tools Complete

## 功能

验证任务工具完整性。

### 核心工具列表

- create_task - 创建新任务
- list_tasks - 列出所有任务
- cancel_task - 取消正在执行的任务
- get_task_status - 获取任务状态
- update_task - 更新任务配置

### 验证示例

```javascript
const tools = checkTaskTools();

// 返回
{
  create_task: ✅,
  list_tasks: ✅,
  cancel_task: ✅,
  get_task_status: ✅,
  update_task: ✅
}
```

### 检查时机

- 系统启动时验证
- 任务执行前检查
- 定期健康检查

---

来源: Claude Code tasks/tools.ts