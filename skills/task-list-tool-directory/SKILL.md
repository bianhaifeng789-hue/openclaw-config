---
name: task-list-tool-directory
description: "任务列表工具目录。管理任务列表相关工具，列出和管理任务队列。Use when listing and managing tasks."
---

# Task List Tool Directory

## 功能

管理任务列表工具。

### 核心工具

- list_tasks - 列出所有任务
- get_task - 获取单个任务详情
- filter_tasks - 按条件过滤任务
- sort_tasks - 排序任务列表
- search_tasks - 搜索任务

### 使用示例

```javascript
// 列出所有任务
listTasks();

// 按状态过滤
filterTasks({ status: 'running' });

// 获取任务详情
getTask('task-001');

// 搜索任务
searchTasks('ROI');
```

### 过滤条件

- status - 状态过滤
- type - 类型过滤
- priority - 优先级过滤
- createdAfter - 时间过滤

---

来源: Claude Code tasks/listTool.ts