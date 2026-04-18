---
name: check-context-warnings-pattern
description: "上下文警告检查模式。检测上下文异常，发送警告通知。Use when detecting context anomalies."
---

# Check Context Warnings Pattern

## 功能

检测上下文异常。

### 检测项

- 上下文过大
- 重复消息
- 无效工具调用
- 长时间无响应

### 示例

```javascript
const warnings = checkContextWarnings(context);

// 返回
[
  { type: 'size', message: '上下文接近阈值' },
  { type: 'repetition', message: '重复消息过多' }
]
```

---

来源: Claude Code context/checkWarnings.ts