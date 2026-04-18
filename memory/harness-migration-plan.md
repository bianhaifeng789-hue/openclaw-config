# Harness Engineering 移植计划

## 移植优先级

### P0 - 立即移植（核心增强）
1. **焦虑检测机制** → context.py detect_anxiety()
2. **三级门控（PreExit）** → Review Agent pre_exit钩子
3. **Smart Truncate** → loop-detector.js增强

### P1 - 重要移植
4. **LoopDetection增强** → 文件编辑计数
5. **TimeBudget** → time-budget.js
6. **TaskTracking** → task-tracking.js

### P2 - 可选移植
7. **Skill渐进披露** → 改skills/为三级加载
8. **ErrorGuidance** → error-guidance.js
9. **Contract协商** → PM-Review磋商机制

---

## P0-1: 焦虑检测机制

### 目标
检测模型"提前收工"信号，触发reset而非compaction

### 实现位置
- 文件：`impl/bin/anxiety-detector.js`
- 集成：`skills/loop-detection/SKILL.md`

### 核心算法
```javascript
const ANXIETY_PATTERNS = [
  /let me wrap up/i,
  /that should be enough/i,
  /running (low|out) of context/i,
  /to save tokens/i,
  /i've covered the main/i,
  /in summary/i,
  /to summarize/i,
  /i'll conclude/i,
  /moving on/i
];

function detectAnxiety(messages) {
  const matches = ANXIETY_PATTERNS
    .map(pattern => messages.filter(m => pattern.test(m.content)).length)
    .reduce((sum, count) => sum + count, 0);
  
  return matches >= 2 ? {anxiety: true, matches} : {anxiety: false, matches};
}
```

### 触发条件
- matches >= 2 → Reset（checkpoint + fresh start）
- matches == 1 → Warning

### Checkpoint格式
```markdown
# Checkpoint

## Completed Work
- [列出已完成]

## Current State
- [当前状态]

## Next Steps
- [下一步]

## Key Decisions
- [关键决策]
```

---

## P0-2: 三级门控机制

### 目标
防止假完成，强制验证

### 实现位置
- 文件：`skills/pre-exit-gate/SKILL.md`
- 集成：Review Agent

### 门控逻辑
```javascript
function preExitGate(state) {
  const {hasWork, exitAttempts} = state;
  
  // Gate 1: 无工作 → 强制开始
  if (!hasWork && exitAttempts < 3) {
    return {gate: 1, action: 'force_start', message: '请先完成一些工作'};
  }
  
  // Gate 2: 有工作第1次退出 → 强制验证
  if (hasWork && exitAttempts === 1) {
    return {gate: 2, action: 'force_verify', message: '请验证你的工作'};
  }
  
  // Gate 3: 已验证 → 允许退出
  if (exitAttempts >= 2) {
    return {gate: 3, action: 'allow_exit', message: '可以退出'};
  }
  
  return {gate: 0, action: 'continue'};
}
```

### 自动检查
- 扫描 workspace 检测 TODO/NotImplementedError
- 检测空文件（0 bytes）
- 提取原始任务需求注入验证提示

---

## P0-3: Smart Truncate Output

### 目标
防止工具输出撑爆上下文

### 实现位置
- 文件：`impl/bin/smart-truncate.js`
- 集成：工具输出处理层

### 预算分配算法
```javascript
function smartTruncate(output, limit = 50000) {
  if (output.length <= limit) return output;
  
  // stderr优先（40%预算）
  const stderr_budget = limit * 0.4;
  const stderr_lines = extractStderr(output);
  const stderr_result = truncateHead(stderr_lines, stderr_budget);
  
  // stdout预算（60%）
  const stdout_budget = limit * 0.6;
  const stdout_lines = extractStdout(output);
  
  // head 40% + tail 40% + important-middle 20%
  const head_budget = stdout_budget * 0.4;
  const tail_budget = stdout_budget * 0.4;
  const middle_budget = stdout_budget * 0.2;
  
  const head_result = truncateHead(stdout_lines, head_budget);
  const tail_result = truncateTail(stdout_lines, tail_budget);
  const important_middle = extractImportant(stdout_lines, middle_budget);
  
  return combine([stderr_result, head_result, important_middle, tail_result]);
}

function extractImportant(lines, budget) {
  const ERROR_PATTERNS = /error|warning|fail|assert|traceback|exception/i;
  const important = lines.filter(line => ERROR_PATTERNS.test(line));
  return truncateToBudget(important, budget);
}
```

### 大输出持久化
- >50k chars → 写入 `_tool_output_{name}.txt`
- 返回2000 chars preview + 文件路径提示

---

## 实施时间表

### Week 1: P0移植
- Day 1-2: 焦虑检测机制
- Day 3-4: 三级门控机制
- Day 5: Smart Truncate

### Week 2: P1移植
- Day 6-7: LoopDetection增强
- Day 8-9: TimeBudget + TaskTracking
- Day 10: 测试验证

### Week 3: P2移植
- Day 11-12: Skill渐进披露
- Day 13-14: ErrorGuidance
- Day 15: Contract协商

---

## 测试计划

### 单元测试
- `impl/tests/anxiety-detector.test.js`
- `impl/tests/pre-exit-gate.test.js`
- `impl/tests/smart-truncate.test.js`

### 集成测试
- TB2 benchmark验证效果
- 对比移植前后错误率

### 验收标准
- 焦虑检测：减少提前收工30%
- 三级门控：减少假完成50%
- Smart Truncate：防止上下文撑爆

---

创建时间：2026-04-17 11:58
状态：开始实施P0-1（焦虑检测）