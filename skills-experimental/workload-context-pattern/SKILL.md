---
name: workload-context-pattern
description: "工作量上下文模式。根据上下文压力自动调整工作量，避免超时和卡死。Use when adjusting workload based on context pressure."
---

# Workload Context Pattern

## 功能

动态调整工作量策略。

### 压力级别

- high（压力高）: 单次1-2文件
- medium（压力中）: 单次3-5文件
- low（压力低）: 单次5-10文件

### 调整示例

```javascript
const pressure = getContextPressure();

if (pressure > 150000) {
  // 高压力：减少工作量
  setWorkload('high');
  maxFilesPerTurn = 2;
} else if (pressure > 100000) {
  // 中压力：适中
  setWorkload('medium');
  maxFilesPerTurn = 5;
} else {
  // 低压力：正常
  setWorkload('low');
  maxFilesPerTurn = 10;
}
```

### 触发时机

- 上下文接近阈值时自动降级
- 检测到typing TTL接近时降级
- Circuit Breaker警告时降级

---

来源: Claude Code patterns/workloadContext.ts