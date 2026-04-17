#!/usr/bin/env node
/**
 * Contract Negotiation - Contract协商实现
 * 
 * PM提出contract → Review审核 → 最多3轮迭代
 * 
 * 来源：Harness Engineering - _negotiate_contract()
 * 
 * 流程：
 * 1. Proposer提出contract.md
 * 2. Reviewer审核（最多3轮）
 * 3. APPROVED → 开始工作
 * 4. 不通过 → Proposer修改
 * 5. 3轮未通过 → 强制继续
 * 
 * 用法：
 * node contract-negotiation.js propose <spec_file> <round_num>
 * node contract-negotiation.js review <contract_file>
 * node contract-negotiation.js check-approved <contract_file>
 */

const fs = require('fs');
const path = require('path');

// 最大迭代轮数
const MAX_ITERATIONS = 3;

// Contract模板
const CONTRACT_TEMPLATE = `## Sprint Contract — Round {round_num}

### Scope
What features/fixes will be implemented this round.

### Deliverables
Specific, concrete outputs (files, components, endpoints).

### Acceptance Criteria
Numbered list of testable behaviors (binary: pass/fail):
1. [First criterion]
2. [Second criterion]
3. [Third criterion]

### Out of Scope
What is explicitly NOT being done this round:
- [First out of scope item]
- [Second out of scope item]

---
Proposed: {timestamp}
`;

/**
 * 提出Contract
 * @param {string} specFile - spec.md路径
 * @param {number} roundNum - 轮数
 * @param {string} workspace - 工作目录
 * @returns {Object} Contract内容
 */
function proposeContract(specFile, roundNum, workspace) {
  // 读取spec
  let spec = '';
  if (fs.existsSync(specFile)) {
    spec = fs.readFileSync(specFile, 'utf8');
  }
  
  // 读取feedback（如果存在）
  const feedbackFile = path.join(workspace, 'feedback.md');
  let feedback = '';
  if (fs.existsSync(feedbackFile)) {
    feedback = fs.readFileSync(feedbackFile, 'utf8');
  }
  
  // 生成Contract模板
  const contract = CONTRACT_TEMPLATE
    .replace('{round_num}', roundNum)
    .replace('{timestamp}', new Date().toISOString());
  
  // 写入contract.md
  const contractPath = path.join(workspace, 'contract.md');
  fs.writeFileSync(contractPath, contract, 'utf8');
  
  return {
    proposed: true,
    path: contractPath,
    roundNum,
    specExists: spec.length > 0,
    feedbackExists: feedback.length > 0
  };
}

/**
 * 审核Contract
 * @param {string} contractFile - contract.md路径
 * @param {string} specFile - spec.md路径
 * @returns {Object} 审核结果
 */
function reviewContract(contractFile, specFile) {
  if (!fs.existsSync(contractFile)) {
    return {
      reviewed: false,
      error: 'contract.md not found'
    };
  }
  
  const contract = fs.readFileSync(contractFile, 'utf8');
  
  // 检查必需部分
  const requiredSections = ['Scope', 'Deliverables', 'Acceptance Criteria', 'Out of Scope'];
  const missingSections = requiredSections.filter(s => !contract.includes(s));
  
  if (missingSections.length > 0) {
    return {
      reviewed: true,
      approved: false,
      reason: `Missing sections: ${missingSections.join(', ')}`,
      revisionRequest: `Please add the following sections: ${missingSections.join(', ')}`
    };
  }
  
  // 检查Acceptance Criteria是否binary
  const criteria = parseAcceptanceCriteria(contract);
  const nonBinary = criteria.filter(c => !isBinaryCriterion(c));
  
  if (nonBinary.length > 0) {
    return {
      reviewed: true,
      approved: false,
      reason: 'Non-binary acceptance criteria detected',
      nonBinaryCriteria: nonBinary,
      revisionRequest: 'Acceptance criteria must be testable (binary: pass/fail). Please revise: ' + nonBinary.join(', ')
    };
  }
  
  // 检查Out of Scope是否明确
  const outOfScope = extractOutOfScope(contract);
  if (outOfScope.length < 1) {
    return {
      reviewed: true,
      approved: false,
      reason: 'Out of Scope section is empty',
      revisionRequest: 'Please list at least 1 item in Out of Scope to prevent scope creep'
    };
  }
  
  // 所有检查通过 → APPROVED
  const approvedContract = 'APPROVED\n\n' + contract;
  fs.writeFileSync(contractFile, approvedContract, 'utf8');
  
  return {
    reviewed: true,
    approved: true,
    criteriaCount: criteria.length,
    outOfScopeCount: outOfScope.length
  };
}

/**
 * 解析Acceptance Criteria
 * @param {string} contract - Contract内容
 * @returns {Array} Criteria列表
 */
function parseAcceptanceCriteria(contract) {
  // 提取Acceptance Criteria部分
  const match = contract.match(/### Acceptance Criteria\n(.*?)\n###/s);
  
  if (!match) {
    return [];
  }
  
  const criteriaText = match[1];
  
  // 解析编号列表
  const criteria = [];
  const lines = criteriaText.split('\n');
  
  for (const line of lines) {
    const numbered = line.match(/^\d+\.\s*(.+)$/);
    if (numbered) {
      criteria.push(numbered[1]);
    }
  }
  
  return criteria;
}

/**
 * 检查是否binary标准
 * @param {string} criterion - 验收标准
 * @returns {boolean} 是否binary
 */
function isBinaryCriterion(criterion) {
  // 非binary关键词
  const nonBinaryKeywords = [
    'should look',
    'should be',
    'smooth',
    'nice',
    'good',
    'responsive',
    'user-friendly',
    'intuitive'
  ];
  
  // 检查是否包含非binary关键词
  const hasNonBinary = nonBinaryKeywords.some(k => criterion.toLowerCase().includes(k));
  
  // 检查是否包含可测试操作
  const testableKeywords = [
    'click',
    'see',
    'display',
    'show',
    'update',
    'run',
    'pass',
    'fail',
    'check',
    'verify'
  ];
  
  const hasTestable = testableKeywords.some(k => criterion.toLowerCase().includes(k));
  
  return !hasNonBinary && hasTestable;
}

/**
 * 提取Out of Scope
 * @param {string} contract - Contract内容
 * @returns {Array} Out of Scope列表
 */
function extractOutOfScope(contract) {
  // 提取Out of Scope部分
  const match = contract.match(/### Out of Scope\n(.*?)\n---/s);
  
  if (!match) {
    return [];
  }
  
  const outOfScopeText = match[1];
  
  // 解析列表项
  const items = [];
  const lines = outOfScopeText.split('\n');
  
  for (const line of lines) {
    const item = line.match(/^-\s*(.+)$/);
    if (item) {
      items.push(item[1]);
    }
  }
  
  return items;
}

/**
 * 检查是否已APPROVED
 * @param {string} contractFile - contract.md路径
 * @returns {Object} 检查结果
 */
function checkApproved(contractFile) {
  if (!fs.existsSync(contractFile)) {
    return {
      exists: false,
      approved: false
    };
  }
  
  const contract = fs.readFileSync(contractFile, 'utf8');
  
  // 检查前200字符是否包含APPROVED
  const approved = contract.toUpperCase().slice(0, 200).includes('APPROVED');
  
  return {
    exists: true,
    approved
  };
}

/**
 * 执行协商循环
 * @param {string} workspace - 工作目录
 * @param {number} roundNum - 轮数
 * @returns {Object} 协商结果
 */
function negotiate(workspace, roundNum) {
  const specFile = path.join(workspace, 'spec.md');
  const contractFile = path.join(workspace, 'contract.md');
  
  // Step 1: Propose
  proposeContract(specFile, roundNum, workspace);
  
  // Step 2: Review (最多3轮)
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const reviewResult = reviewContract(contractFile, specFile);
    
    if (reviewResult.approved) {
      return {
        status: 'approved',
        iterations: i + 1,
        contractPath: contractFile
      };
    }
    
    // 不通过 → Proposer修改
    if (i < MAX_ITERATIONS - 1) {
      // 实际场景中会调用PM Agent修改
      // 这里简化为提示
      console.log(`Iteration ${i + 1}: Review requested changes`);
    }
  }
  
  // 3轮未通过 → 强制继续
  return {
    status: 'forced',
    iterations: MAX_ITERATIONS,
    contractPath: contractFile,
    warning: 'Max iterations reached, proceeding with current contract'
  };
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'propose') {
    const specFile = args[1];
    const roundNum = parseInt(args[2]) || 1;
    const workspace = args[3] || process.cwd();
    
    const result = proposeContract(specFile, roundNum, workspace);
    console.log(JSON.stringify(result, null, 2));
    
  } else if (command === 'review') {
    const contractFile = args[1];
    const specFile = args[2];
    
    const result = reviewContract(contractFile, specFile);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.approved) {
      console.log('\n✅ Contract APPROVED');
    } else {
      console.log('\n❌ Contract needs revision');
    }
    
  } else if (command === 'check-approved') {
    const contractFile = args[1];
    
    const result = checkApproved(contractFile);
    console.log(JSON.stringify(result, null, 2));
    
  } else if (command === 'test') {
    // 测试binary检测
    const binaryCriterion = 'User can click "Start" and timer begins';
    const nonBinaryCriterion = 'Timer should look nice';
    console.log('Binary检测测试:', isBinaryCriterion(binaryCriterion) ? '✅' : '❌');
    console.log('非Binary检测测试:', !isBinaryCriterion(nonBinaryCriterion) ? '✅' : '❌');
    
    // 测试Contract模板
    const workspace = process.cwd();
    const result = proposeContract('', 1, workspace);
    console.log('Contract提出测试:', result.proposed ? '✅' : '❌');
    
    // 测试审核
    const contractFile = result.path;
    const reviewResult = reviewContract(contractFile, '');
    console.log('Contract审核测试:', reviewResult.reviewed ? '✅' : '❌');
    
    // 清理测试文件
    if (fs.existsSync(contractFile)) {
      fs.unlinkSync(contractFile);
    }
    
  } else {
    console.log(`
Contract Negotiation - Contract协商

用法:
  node contract-negotiation.js propose <spec_file> <round_num> [workspace]
  node contract-negotiation.js review <contract_file> [spec_file]
  node contract-negotiation.js check-approved <contract_file>
  node contract-negotiation.js test

协商流程:
  1. Proposer提出contract.md
  2. Reviewer审核（最多3轮）
  3. APPROVED → 开始工作
  4. 不通过 → Proposer修改
  5. 3轮未通过 → 强制继续

Contract结构:
  - Scope: 范围
  - Deliverables: 输出物
  - Acceptance Criteria: binary验收标准
  - Out of Scope: 明确不做
`);
  }
}

// 导出函数
module.exports = {
  proposeContract,
  reviewContract,
  parseAcceptanceCriteria,
  isBinaryCriterion,
  extractOutOfScope,
  checkApproved,
  negotiate,
  MAX_ITERATIONS,
  CONTRACT_TEMPLATE
};

// CLI入口
if (require.main === module) {
  main();
}