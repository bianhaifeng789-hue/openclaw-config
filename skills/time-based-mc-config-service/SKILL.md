---
name: time-based-mc-config-service
description: "TimeBasedMC配置服务。配置时间基准压缩策略参数，控制旧数据清理规则。Use when configuring time-based micro compact settings."
---

# Time Based MC Config Service

## 功能

配置TimeBasedMC参数。

### 配置项

- ageThreshold - 旧消息时间阈值（默认1小时）
- keepRecent - 保留最近消息数量（默认10）
- compressLevel - 压缩级别（默认0）
- scheduleInterval - 执行间隔（默认1小时）

### 使用示例

```javascript
// 设置配置
setTimeBasedMCConfig({
  ageThreshold: 3600000, // 1小时
  keepRecent: 10,
  compressLevel: 0,
  scheduleInterval: '1h'
});

// 获取配置
const config = getTimeBasedMCConfig();
```

### 清理规则

- 超过阈值的工具结果删除
- 最近消息保留
- 按时间排序清理

---

来源: Claude Code services/compact/timeBasedMCConfig.ts