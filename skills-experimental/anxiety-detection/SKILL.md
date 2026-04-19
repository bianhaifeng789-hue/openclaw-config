---
name: anxiety-detection
description: 焦虑检测机制，识别模型"提前收工"信号并触发reset。集成到Agent循环中，检测assistant消息中的焦虑模式。适用所有长任务场景，防止Agent因上下文焦虑而假完成。
---

# Anxiety Detection - 焦虑检测机制

## 概述

检测模型"提前收工"信号，触发checkpoint + reset而非compaction。

来源：Harness Engineering - context.py detect_anxiety()

## 检测时机

在Agent循环中，每次收到assistant消息后检测：

```javascript
// Agent while循环
for (const message of response.messages) {
  if (message.role === 'assistant') {
    // 焦虑检测
    const anxietyResult = anxietyDetector.analyze(context.messages);
    
    if (anxietyResult.action === 'reset') {
      // 创建checkpoint
      const checkpoint = createCheckpoint(context);
      
      // Reset上下文
      context = restoreFromCheckpoint(checkpoint, systemPrompt);
      
      // 通知用户
      log.warning(`焦虑触发Reset (${anxietyResult.matches}个信号)`);
    }
  }
}
```

## 焦虑信号（9个模式）

```javascript
const ANXIETY_PATTERNS = [
  /let me wrap up/i,           // 收尾
  /that should be enough/i,    // 认为足够
  /running (low|out) of context/i, // 上下文紧张
  /to save tokens/i,           // 节省token
  /i've covered the main/i,    // 覆盖主要
  /in summary/i,               // 总结
  /to summarize/i,             // 总结
  /i'll conclude/i,            // 结论
  /moving on/i                 // 继续
];
```

## 触发条件

| Matches | Action | 说明 |
|---------|--------|------|
| **>= 2** | Reset | 创建checkpoint + 清空上下文 |
| **== 1** | Warning | 注入警告提示 |
| **0** | Continue | 正常继续 |

## Checkpoint格式

```markdown
# Checkpoint - Anxiety Reset

## 焦虑触发原因
- 检测到焦虑信号：2个
- 上下文大小：150k tokens

## Completed Work
- [列出已完成]

## Current State
- 焦虑触发reset，需要从checkpoint继续

## Next Steps
- 检查已完成工作
- 继续未完成任务

## Key Decisions
- 触发焦虑reset而非compaction

---
生成时间：2026-04-17T12:02:00Z
```

## 实现位置

### 文件位置

- **检测器**: `impl/bin/anxiety-detector.js`
- **集成点**: Agent循环（agents.py或等效）

### 集成代码

```javascript
// 在Agent循环开始处导入
const anxietyDetector = require('./anxiety-detector.js');

// 在每次assistant消息后检测
if (message.role === 'assistant') {
  const anxietyResult = anxietyDetector.detectAnxiety(context.messages);
  
  if (anxietyResult.anxiety) {
    // 创建checkpoint
    const checkpointFile = anxietyDetector.createCheckpoint(workspace, {
      matches: anxietyResult.matches,
      tokens: context.tokenCount,
      patterns: anxietyResult.patterns
    });
    
    // Reset上下文
    context.reset(checkpointFile);
    
    // 注入恢复提示
    context.messages.push({
      role: 'user',
      content: `焦虑触发Reset。请从checkpoint恢复:\n${checkpointFile}`
    });
  }
}
```

## 与Compaction的区别

| 特性 | Compaction | Anxiety Reset |
|------|-----------|---------------|
| **触发条件** | Token阈值（>160k） | 焦虑信号（>=2个） |
| **操作** | 压缩历史消息 | 清空全部 + checkpoint |
| **保留** | 重要消息摘要 | checkpoint文件 |
| **恢复** | 从压缩后继续 | 从checkpoint重新开始 |

**关键区别**: Anxiety Reset是"全新白板"，Compaction是"压缩保留"

## 与Loop Detection配合

Anxiety Detection在Loop Detection之后：

```
Loop Detection (file_edit >= 4) → 强制重新思考
    ↓
Anxiety Detection (matches >= 2) → Reset
    ↓
PreExit Gate (exit_attempts) → 强制验证
    ↓
允许退出
```

## 测试用例

```javascript
// 测试焦虑检测
const testMessages = [
  {role: 'assistant', content: 'Let me wrap up'},
  {role: 'assistant', content: 'That should be enough'}
];

const result = anxietyDetector.detectAnxiety(testMessages);
assert(result.anxiety === true);
assert(result.matches === 2);

// 测试checkpoint生成
const checkpoint = anxietyDetector.generateCheckpoint({
  matches: 2,
  tokens: 150000,
  completedWork: '- 完成模块A\n- 完成模块B'
});

assert(checkpoint.includes('焦虑触发'));
```

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| threshold | 2 | 焦虑信号阈值 |
| reset_threshold | 150k | Token Reset阈值 |
| checkpoint_dir | .checkpoints | Checkpoint目录 |

## 效果对比

| 场景 | Before | After |
|------|--------|-------|
| **上下文焦虑** | 继续工作 → 假完成 | Reset → 真完成 |
| **焦虑信号** | 无检测 → 继续 | 检测 → Reset |
| **Checkpoint** | 无 | 有完整记录 |

**预期效果**: 减少提前收工30%

---

## CLI命令

```bash
# 分析消息检测焦虑
node anxiety-detector.js analyze <messages_json>

# 查看状态
node anxiety-detector.js status

# 运行测试
node anxiety-detector.js test
```

---

创建时间：2026-04-17 12:02
版本：1.0.0
状态：已集成到OpenClaw