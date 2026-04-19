---
name: smart-truncate-output
description: 智能截断工具输出，防止撑爆上下文。stderr优先保留错误信息，stdout分三段(head/tail/important-middle)保留关键内容。适用所有工具输出场景，特别是长输出工具如bash、文件读取等。
---

# Smart Truncate Output - 智能截断工具输出

## 概述

防止工具输出撑爆上下文，保留关键信息（错误、警告、重要行）。

来源：Harness Engineering - tools.py smart_truncate()

## 预算分配

```
总预算: 50,000 chars

stderr: 40%优先（20,000 chars）
  - 错误信息最重要
  - 完整保留

stdout: 60%（30,000 chars）
  - head: 40%（12,000 chars）
  - tail: 40%（12,000 chars）
  - important-middle: 20%（6,000 chars）
```

## 重要关键词

```javascript
const IMPORTANT_PATTERNS = [
  /error/i,
  /warning/i,
  /fail/i,
  /assert/i,
  /traceback/i,
  /exception/i,
  /crash/i,
  /abort/i,
  /fatal/i,
  /critical/i
];
```

## 工作流程

### 小输出（≤50k chars）

```
原始输出 → 直接返回 → 无截断
```

### 大输出（>50k chars）

```
原始输出
    ↓
分离stderr/stdout
    ↓
stderr: 截取头部（优先）
    ↓
stdout: 截取头部 + 尾部 + 重要中间行
    ↓
组合结果 + 添加截断信息
    ↓
返回截断输出
```

### 超大输出（需要持久化）

```
原始输出
    ↓
截断处理
    ↓
持久化到文件: _tool_output_{name}.txt
    ↓
返回2000 chars preview + 文件路径提示
```

## 实现位置

### 文件位置

- **截断器**: `impl/bin/smart-truncate.js`
- **集成点**: 工具执行后输出处理

### 集成代码

```javascript
// 在工具执行后处理输出
const smartTruncate = require('./smart-truncate.js');

// 工具执行
const result = executeTool(tool_name, args);

// 处理输出
if (result.output && result.output.length > smartTruncate.DEFAULT_LIMIT) {
  const processed = smartTruncate.processOutput(result.output, {
    workspace: config.WORKSPACE,
    toolName: tool_name
  });
  
  // 返回截断输出
  if (processed.persisted) {
    return {
      output: processed.content,
      truncated: true,
      filePath: processed.filePath,
      preview: processed.preview
    };
  }
  
  return {
    output: processed.content,
    truncated: true
  };
}

return {output: result.output, truncated: false};
```

## 输出格式

### 截断输出格式

```
=== STDERR ===
[错误信息...]

=== STDOUT HEAD ===
[输出头部...]

=== IMPORTANT LINES ===
[重要行：包含error/warning/fail等关键词]

=== STDOUT TAIL ===
[输出尾部...]

[TRUNCATED] Original: 100,000 chars → Truncated: 50,000 chars (50%)
```

### 持久化输出格式

```
[Preview前2000 chars]

...

[TRUNCATED] Original output saved to: _tool_outputs/bash_1234567890.txt
Full output: 100,000 chars
Preview: 2,000 chars
```

## 大输出持久化

```javascript
// >50k chars → 持久化
const outputDir = path.join(workspace, '_tool_outputs');
const fileName = `${toolName}_${timestamp}.txt`;
const filePath = path.join(outputDir, fileName);

fs.writeFileSync(filePath, fullOutput, 'utf8');

// 返回preview
const preview = fullOutput.slice(0, 2000);
```

## 测试用例

```javascript
// 测试截断
const largeOutput = Array(1000).fill('test line').join('\n');
largeOutput += '\nerror: test error\nwarning: test warning';

const result = smartTruncate.smartTruncate(largeOutput, 5000);

assert(result.length < largeOutput.length);
assert(result.includes('error: test error'));
assert(result.includes('[TRUNCATED]'));
```

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| DEFAULT_LIMIT | 50000 | 截断阈值 |
| PREVIEW_LIMIT | 2000 | Preview长度 |
| stderr_budget | 40% | stderr预算 |
| stdout_budget | 60% | stdout预算 |
| head_budget | 40% of stdout | head预算 |
| tail_budget | 40% of stdout | tail预算 |
| middle_budget | 20% of stdout | important-middle预算 |

## 效果对比

| 场景 | Before | After |
|------|--------|-------|
| **长输出** | 全部注入上下文 → 撑爆 | 截断保留关键 → 不撑爆 |
| **错误信息** | 可能被截断丢失 | stderr优先完整保留 |
| **重要行** | 随机截断可能丢失 | 专门提取保留 |
| **超大输出** | 全部注入 → 撑爆 | 持久化文件 + preview |

**预期效果**: 防止上下文撑爆，保留关键信息

---

## CLI命令

```bash
# 截断输出
node smart-truncate.js truncate <output> [limit]

# 持久化输出
node smart-truncate.js persist <output> [workspace] [toolName]

# 运行测试
node smart-truncate.js test
```

---

创建时间：2026-04-17 12:02
版本：1.0.0
状态：已集成到OpenClaw工具输出层