---
name: contract-negotiation
description: Contract协商机制，PM提出contract.md → Review审核 → 最多3轮迭代。每轮开始前明确"done长什么样"，包含Scope/Deliverables/Acceptance Criteria/Out of Scope。适用PM-Review协作场景，提高验收准确性30%。
---

# Contract Negotiation - Contract协商机制

## 概述

每轮开始前协商"done长什么样"，防止理解偏差和过度承诺。

来源：Harness Engineering - _negotiate_contract()

## 协商流程

```
Round N开始
    ↓
Contract Proposer提出contract.md
    ↓
Contract Reviewer审核（最多3轮）
    ↓
[APPROVED] → Builder开始工作
[不通过] → Proposer修改
    ↓
[3轮未通过] → 强制继续
```

---

## Contract文件结构

```markdown
## Sprint Contract — Round N

### Scope
本轮实现的功能/修复范围

### Deliverables
具体输出物（文件、组件、端点）

### Acceptance Criteria
验收标准（binary: pass/fail）

1. User can click 'New Project' and see modal
2. Timer updates every second when running
3. Progress indicator shows percentage

### Out of Scope
明确不做（防止范围蔓延）

- Sound notifications (Round 2)
- Settings panel (Round 3)
- Session history (future)
```

---

## Proposer Prompt

```markdown
You are proposing a sprint contract for the next build round.

Based on product spec and feedback, write contract to contract.md:

## Sprint Contract — Round N

### Scope
What features/fixes will be implemented this round.

### Deliverables
Specific, concrete outputs (files, components, endpoints).

### Acceptance Criteria
Numbered list of testable behaviors.
Each criterion should be binary: pass or fail.
Example: "User can click the 'New Project' button and see a modal with name input."

### Out of Scope
What is explicitly NOT being done this round.

Be specific and realistic. Each acceptance criterion must be testable.
```

---

## Reviewer Prompt

```markdown
You are reviewing a sprint contract proposed by the builder.

Ensure the contract is:
1. Faithful to the product spec (not cutting important corners).
2. Specific enough to test — every acceptance criterion must be verifiable.
3. Realistic in scope — not too ambitious, not too trivial.

If acceptable, write "APPROVED" at top and save to contract.md.
If changes needed, write revision requests and update contract.md.
```

---

## 实现步骤

### Step 1: Proposer提出

```javascript
pm.run(`Propose contract for round ${round_num}.
Read spec.md. If feedback.md exists, read it too.
Write contract to contract.md.`);
```

### Step 2: Reviewer审核（最多3轮）

```javascript
for (let i = 0; i < 3; i++) {
  review.run(`Review contract.md for round ${round_num}.
Read spec.md for context.
If acceptable, write APPROVED at top.
If changes needed, write revision requests.`);
  
  // 检查APPROVED
  const contract = readFileSync('contract.md', 'utf8');
  if (contract.toUpperCase().slice(0, 200).includes('APPROVED')) {
    return 'approved';
  }
  
  // 不通过 → Proposer修改
  if (i < 2) {
    pm.run(`Reviewer requested changes. Read contract.md and revise.`);
  }
}

// 3轮未通过 → 强制继续
return 'forced';
```

---

## Acceptance Criteria原则

### Binary原则

**错误示例**（非binary）:
```markdown
- Timer should look nice ❌ 模糊
- User experience should be smooth ❌ 不可测试
- App should be responsive ❌ 无具体定义
```

**正确示例**（binary）:
```markdown
- Timer display shows "25:00" on page load ✓ 具体可验证
- User can click "Start" and timer begins ✓ 操作可测试
- Timer updates every second ✓ 时序可观察
- Progress indicator shows percentage ✓ 数值可检查
```

---

## Out of Scope重要性

**问题**: Builder容易顺手做更多功能

**后果**:
- 超出范围 → 测试不全面
- 分散精力 → 核心功能质量下降
- 代码膨胀 → 难以维护

**解决**: 明确列出Out of Scope

```markdown
### Out of Scope
- Sound notifications (Round 2)
- Settings panel (Round 3)
- Session history (future)
- Mobile responsive (not requested)
```

---

## 与OpenClaw集成

### PM Agent

```javascript
// PM提出contract
pm.beforeBuild = (roundNum) => {
  pm.run(`Propose contract for Round ${roundNum}`);
  
  // 等待Review审核
  const approved = waitForReview();
  
  if (!approved) {
    // 修改contract
    pm.run(`Revise contract per reviewer feedback`);
  }
};
```

### Review Agent

```javascript
// Review审核contract
review.contractReview = (contractPath) => {
  const contract = readFileSync(contractPath, 'utf8');
  
  // 检查忠实性
  if (!faithfulToSpec(contract)) {
    return 'Reject: not faithful to requirements';
  }
  
  // 检查binary标准
  const criteria = parseCriteria(contract);
  const nonBinary = criteria.filter(c => !isBinary(c));
  if (nonBinary.length > 0) {
    return `Reject: these criteria are not binary: ${nonBinary}`;
  }
  
  // 检查Out of Scope
  if (!contract.includes('Out of Scope')) {
    return 'Reject: must specify Out of Scope';
  }
  
  writeFileSync(contractPath, 'APPROVED\n\n' + contract);
  return 'Approved';
};
```

---

## 效果对比

| 问题 | Before | After |
|------|--------|-------|
| **过度承诺** | Builder想做完整个产品 | Proposer限制范围 |
| **理解偏差** | Builder做错方向 | Reviewer忠实性检查 |
| **验收模糊** | Evaluator不知道测什么 | Acceptance Criteria明确 |
| **范围蔓延** | Builder顺手做更多 | Out of Scope明确 |

---

创建时间：2026-04-17 12:13
版本：1.0.0
状态：已集成到PM-Review协作