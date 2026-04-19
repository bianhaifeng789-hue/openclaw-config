---
name: pre-exit-gate
description: 三级门控机制，防止假完成。在Agent尝试退出时强制验证工作完成度。适用所有需要防止"假完成"的任务场景。
---

# PreExit Gate - 三级门控机制

## 概述

防止Agent"假完成"：声称完成但实际未做任何工作，或工作未通过验证。

来源：Harness Engineering - PreExitVerificationMiddleware

## 三级门控逻辑

### Gate 1: 无工作 → 强制开始

**触发条件**:
- Agent尝试退出
- 未做任何工作（无文件修改、无代码编写）
- exit_attempts < 3

**Action**: 强制开始工作

**注入提示**:
```
STOP. 你声称完成了，但未做任何实际工作。

检查清单:
1. 是否创建了/修改了文件？
2. 是否运行了验证命令？
3. 是否满足了任务需求？

请先完成一些工作，然后再退出。
```

---

### Gate 2: 有工作第1次退出 → 强制验证

**触发条件**:
- Agent尝试退出
- 已做一些工作
- exit_attempts === 1

**Action**: 强制验证

**注入提示**:
```
STOP. 你声称完成了，请验证你的工作。

验证步骤:
1. ls -la — 检查文件是否创建
2. cat/head — 检查文件内容是否真实
3. grep TODO/FIXME — 检查是否有未完成标记
4. 运行测试（如有）— 验证功能是否正确

如果验证失败，请修复问题后再退出。
```

---

### Gate 3: 已验证 → 允许退出

**触发条件**:
- exit_attempts >= 2
- 已通过验证

**Action**: 允许退出

---

## 自动检查项

### 文件检查

```bash
# 检查空文件
find . -type f -size 0 -name "*.py" -o -name "*.js" -o -name "*.ts"

# 检查TODO标记
grep -r "TODO|FIXME|NotImplementedError|pass$" *.py *.js *.ts
```

### 内容检查

```javascript
// Skeleton Detection
const SKELETON_PATTERNS = [
  /TODO/i,
  /FIXME/i,
  /NotImplementedError/,
  /^pass$/,
  /^\/\/ .../,
  /^# .../
];

function detectSkeleton(content) {
  const matches = SKELETON_PATTERNS.filter(p => p.test(content));
  return matches.length > 0;
}
```

### 任务需求注入

```javascript
// 提取原始任务需求，注入验证提示
function injectTaskRequirements(task, verificationPrompt) {
  return `
原始任务需求:
${task}

${verificationPrompt}

请对照任务需求逐项验证是否完成。
`;
}
```

---

## 实现细节

### exit_attempts计数

```javascript
// 在Agent循环中追踪退出尝试
let exit_attempts = 0;

if (message.content && /完成|done|finished/i.test(message.content)) {
  exit_attempts++;
  
  const gateResult = preExitGate({
    hasWork: checkHasWork(),
    exit_attempts
  });
  
  if (gateResult.action !== 'allow_exit') {
    // 注入强制提示
    messages.push({
      role: 'user',
      content: gateResult.message
    });
    continue; // 不退出，继续循环
  }
}
```

### checkHasWork()

```javascript
function checkHasWork() {
  // 检查是否有文件修改
  const modifiedFiles = getModifiedFiles();
  if (modifiedFiles.length === 0) return false;
  
  // 检查是否有实际内容（非空文件、非skeleton）
  const hasRealContent = modifiedFiles.some(f => {
    const content = fs.readFileSync(f, 'utf8');
    return content.length > 100 && !detectSkeleton(content);
  });
  
  return hasRealContent;
}
```

---

## 与Loop Detection配合

PreExit Gate在Loop Detection之后触发：

```
Loop Detection (file_edit >= 4) → 强制重新思考
    ↓
PreExit Gate (exit_attempts) → 强制验证
    ↓
允许退出
```

---

## 与Review Agent集成

Review Agent应启用PreExit Gate：

```yaml
# gateway-config.yaml
agents:
  review:
    pre_exit_gate: true
    max_exit_attempts: 3
```

---

## 效果对比

| 场景 | Before | After |
|------|--------|-------|
| **无工作退出** | Agent说"完成" → 结束 | Gate 1强制开始 |
| **假完成** | Agent说"完成" → 结束 | Gate 2强制验证 |
| **验证失败** | 无检查 → 结束 | Gate 2检测问题 |
| **真完成** | 直接结束 | Gate 3允许退出 |

---

## 移植来源

- **文件**: Harness Engineering/middlewares.py
- **类**: PreExitVerificationMiddleware
- **关键代码**: ~150行

---

## 测试用例

```javascript
// 测试Gate 1
const state = {hasWork: false, exit_attempts: 0};
const result = preExitGate(state);
assert(result.action === 'force_start');

// 测试Gate 2
const state = {hasWork: true, exit_attempts: 1};
const result = preExitGate(state);
assert(result.action === 'force_verify');

// 测试Gate 3
const state = {hasWork: true, exit_attempts: 2};
const result = preExitGate(state);
assert(result.action === 'allow_exit');
```

---

## 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| max_exit_attempts | 3 | 最大退出尝试次数 |
| skeleton_patterns | 6个 | Skeleton检测模式 |
| empty_file_threshold | 100 bytes | 空文件阈值 |
| verification_commands | ls/cat/grep | 验证命令 |

---

创建时间：2026-04-17 11:58
版本：1.0.0
移植状态：完成设计，待集成到Review Agent