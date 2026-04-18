---
name: command-pr-comments
description: "PR评论命令模式。生成Pull Request评论，自动化代码审查。Use when generating automated PR comments."
---

# Command PR Comments

## 功能

生成PR评论。

### 评论类型

- 代码审查意见
- 自动化检查结果
- 格式建议

### 示例

```javascript
generatePRComment({
  prNumber: 42,
  file: 'roi-calculator.js',
  line: 10,
  comment: '建议添加错误处理'
});
```

---

来源: Claude Code commands/prComments.ts