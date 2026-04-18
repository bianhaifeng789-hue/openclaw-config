---
name: tip-history-service
description: "提示历史服务。记录用户已查看的提示，避免重复显示相同提示。Use when tracking which tips user has seen."
---

# Tip History Service

## 功能

记录提示查看历史。

### 记录内容

- tipId - 提示唯一标识
- viewedAt - 查看时间戳
- helpful - 用户反馈是否有用
- dismissed - 用户是否忽略

### 使用示例

```javascript
// 标记提示已查看
markTipViewed('tip-001');

// 检查是否已显示
if (!hasViewedTip('tip-001')) {
  showTip('tip-001');
}

// 获取查看历史
getTipHistory();
```

### 提示类型

- best-practice - 最佳实践
- shortcut - 快捷方式提示
- warning - 警告提示
- feature - 新功能介绍

---

来源: Claude Code services/tipHistory.ts