---
name: tips-service-reference
description: "Tips服务参考。管理使用提示和建议，帮助用户更高效地使用系统。Use when displaying helpful tips to user."
---

# Tips Service Reference

## 功能

管理提示信息库。

### 提示类型

- 使用技巧 - 如何高效使用功能
- 最佳实践 - 推荐的操作方式
- 常见错误 - 需要避免的问题
- 新功能 - 新增功能介绍

### 使用示例

```javascript
// 显示提示
showTip({
  type: 'best-practice',
  category: 'context',
  message: '使用 compact 定期清理上下文可避免超时'
});

// 获取相关提示
getTipsForCategory('context');

// 标记提示有用
markTipHelpful('tip-001');
```

### 提示触发时机

- 用户首次使用功能
- 检测到低效操作
- 错误发生后
- 新功能上线时

---

来源: Claude Code services/tips.ts