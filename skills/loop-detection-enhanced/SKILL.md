---
name: loop-detection-enhanced
description: LoopDetection增强版，检测文件编辑循环（≥4次）、命令循环（≥3次）、错误循环（≥3次）。触发时强制重新思考，防止doom loop浪费token。适用所有Agent循环场景。
---

# Loop Detection Enhanced - 循环检测增强版

## 概述

检测Agent陷入循环（doom loop），强制重新思考。

来源：Harness Engineering - LoopDetectionMiddleware

## 检测类型

### 1. 文件编辑循环

**触发条件**：同一文件被编辑 ≥4 次

**检测算法**：
```javascript
const fileEditHistory = {};
for (const call of toolCalls) {
  if (call.name === 'edit' || call.name === 'write') {
    const filePath = call.args.path;
    fileEditHistory[filePath] = (fileEditHistory[filePath] || 0) + 1;
    
    if (fileEditHistory[filePath] >= 4) {
      triggerLoopWarning('file_edit', filePath);
    }
  }
}
```

**处理策略**：
- 强制重新思考
- 提示："You've edited {file} 4+ times. Consider alternative approach."

---

### 2. 命令循环

**触发条件**：相同命令执行 ≥3 次（模糊匹配）

**检测算法**：
```javascript
const commandHistory = [];
for (const call of toolCalls) {
  if (call.name === 'exec') {
    const cmd = call.args.command;
    
    // 模糊匹配（忽略参数变化）
    const cmdBase = cmd.split(' ')[0];
    
    for (const hist of commandHistory) {
      if (hist.base === cmdBase && Date.now() - hist.timestamp < 60000) {
        hist.count++;
        
        if (hist.count >= 3) {
          triggerLoopWarning('command_repeat', cmdBase);
        }
      }
    }
  }
}
```

**处理策略**：
- Doom loop警告
- 提示："Command {cmd} repeated 3+ times. Consider checking error logs or trying different approach."

---

### 3. 错误循环

**触发条件**：连续失败 ≥3 次

**检测算法**：
```javascript
let consecutiveErrors = 0;
for (const result of toolResults) {
  if (result.error || result.status === 'error') {
    consecutiveErrors++;
    
    if (consecutiveErrors >= 3) {
      triggerLoopWarning('error_repeat', consecutiveErrors);
    }
  } else {
    consecutiveErrors = 0;  // 成功后重置
  }
}
```

**处理策略**：
- 诊断根因建议
- 提示："3+ consecutive errors. Check: 1) Command syntax 2) Environment setup 3) Dependencies"

---

## 与OpenClaw集成

### Agent循环检测

```javascript
// Agent while循环中
for (const message of response.messages) {
  if (message.role === 'assistant') {
    // 循环检测
    const loopResult = loopDetector.check(toolCalls);
    
    if (loopResult.detected) {
      // 强制重新思考
      injectNudge({
        type: loopResult.type,
        message: loopResult.message,
        suggestion: loopResult.suggestion
      });
      
      // 记录统计
      loopStats.warnCount++;
    }
  }
}
```

---

## 状态追踪

### heartbeat-state.json字段

```json
{
  "loopStats": {
    "warnCount": 0,
    "hardStopCount": 0,
    "totalCalls": 0,
    "fileEditLoops": [],
    "commandLoops": [],
    "errorLoops": []
  }
}
```

---

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| fileEditThreshold | 4 | 文件编辑阈值 |
| commandRepeatThreshold | 3 | 命令重复阈值 |
| errorThreshold | 3 | 错误阈值 |
| timeWindow | 60000 | 检测窗口（60秒） |
| cooldownPeriod | 300000 | 冷却期（5分钟） |

---

创建时间：2026-04-17 12:34
版本：1.0.0
状态：已集成到OpenClaw Agent循环