---
name: compact-warning-hook-service
description: "压缩警告钩子服务。检测上下文压力，发送压缩警告通知。Use when context size approaches thresholds."
---

# Compact Warning Hook Service

## 功能

检测上下文压力，发送警告。

### 阈值配置

- warning: 160k (89%)
- error: 160k (89%)
- auto: 167k (93%)

### 钩子触发

```javascript
// 当上下文接近阈值时触发
function compactWarningHook(contextSize) {
  if (contextSize > 160000) {
    return {
      warning: '⚠️ 上下文压力过高',
      recommendation: '建议执行 compact',
      urgency: 2
    };
  }
}
```

### 飞书卡片

```json
{
  "elements": [
    {
      "text": {
        "content": "⚠️ 上下文压力警告\n\n当前: 165k/180k\n建议: 执行 compact-cli.js auto"
      }
    }
  ]
}
```

---

来源: Claude Code services/compact/compactWarningHook.ts