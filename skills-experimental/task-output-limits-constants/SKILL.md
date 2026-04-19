---
name: task-output-limits-constants
description: "任务输出限制常量。定义任务输出的最大限制，防止输出过大影响系统。Use when checking task output size limits."
---

# Task Output Limits Constants

## 功能

定义输出限制常量。

### 核心常量

- MAX_OUTPUT_SIZE = 20KB - 最大输出大小
- MAX_LINE_COUNT = 1000 - 最大行数
- MAX_TOOL_CALLS = 50 - 最大工具调用数
- MAX_MESSAGE_LENGTH = 10000 - 最大消息长度

### 使用示例

```javascript
// 检查输出限制
const check = checkOutputLimit(output);

// 返回检查结果
if (output.length > MAX_OUTPUT_SIZE) {
  truncateOutput(output, MAX_OUTPUT_SIZE);
}

// 统计工具调用
if (toolCalls.length > MAX_TOOL_CALLS) {
  warnTooManyToolCalls();
}
```

### 超限处理

- 截断输出 - 超过大小截断
- 警告提示 - 接近阈值警告
- 强制限制 - 超限强制限制

---

来源: Claude Code tasks/outputLimits.ts