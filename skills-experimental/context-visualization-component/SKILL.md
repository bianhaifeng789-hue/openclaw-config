---
name: context-visualization-component
description: "上下文可视化组件。展示上下文token使用情况，帮助用户理解当前状态。Use when displaying context usage to user."
---

# Context Visualization Component

## 功能

可视化展示上下文状态。

### 显示内容

- 总token数
- 各来源占比（Project/User/System）
- 压缩进度
- 预警状态

### 示例

```
📊 Context Visualization

Total: 165k / 180k (92%)

Sources:
- Project: 80k (48%)
- User: 50k (30%)
- System: 35k (21%)

Status: ⚠️ 接近阈值
```

---

来源: Claude Code components/ContextVisualization.tsx