#!/usr/bin/env node
/**
 * PreExit Gate - 三级门控机制实现
 * 
 * 防止Agent假完成，强制验证工作
 * 
 * 来源：Harness Engineering - PreExitVerificationMiddleware
 * 
 * 门控逻辑：
 * - Gate 1: 无工作 → 强制开始
 * - Gate 2: 有工作第1次退出 → 强制验证
 * - Gate 3: 已验证 → 允许退出
 * 
 * 用法：
 * node pre-exit-gate.js check <state_json>
 * node pre-exit-gate.js status
 */

const fs = require('fs');
const path = require('path');

// Skeleton检测模式
const SKELETON_PATTERNS = [
  /TODO/i,
  /FIXME/i,
  /NotImplementedError/,
  /^pass$/,
  /^\/\/ .../,
  /^# .../,
  /pass # TODO/,
  /raise NotImplemented/,
  /\# TODO: implement/i,
  /\# TODO: add/i,
  /\# TODO: fix/i
];

// 空文件阈值
const EMPTY_FILE_THRESHOLD = 100;

/**
 * 三级门控检查
 * @param {Object} state - 状态信息
 * @returns {Object} 门控结果
 */
function preExitGate(state) {
  const {hasWork, exit_attempts, workspace} = state;
  
  // Gate 1: 无工作 → 强制开始
  if (!hasWork && exit_attempts < 3) {
    return {
      gate: 1,
      action: 'force_start',
      message: getForceStartMessage(),
      can_exit: false
    };
  }
  
  // Gate 2: 有工作第1次退出 → 强制验证
  if (hasWork && exit_attempts === 1) {
    return {
      gate: 2,
      action: 'force_verify',
      message: getForceVerifyMessage(workspace),
      can_exit: false
    };
  }
  
  // Gate 3: 已验证 → 允许退出
  if (exit_attempts >= 2) {
    return {
      gate: 3,
      action: 'allow_exit',
      message: getAllowExitMessage(),
      can_exit: true
    };
  }
  
  return {
    gate: 0,
    action: 'continue',
    message: '',
    can_exit: false
  };
}

/**
 * Gate 1强制开始消息
 * @returns {string}
 */
function getForceStartMessage() {
  return `
STOP. 你声称完成了，但未做任何实际工作。

检查清单:
1. 是否创建了/修改了文件？
2. 是否运行了验证命令？
3. 是否满足了任务需求？

请先完成一些工作，然后再退出。

退出尝试次数: 如果你继续声称完成但无工作，将被强制开始。
`;
}

/**
 * Gate 2强制验证消息（增强版，包含自动检查结果）
 * @param {string} workspace - 工作目录
 * @returns {string}
 */
function getForceVerifyMessage(workspace) {
  // 执行自动检查
  const autoCheckResults = workspace ? autoCheck(workspace) : null;
  
  let issuesWarning = '';
  if (autoCheckResults && autoCheckResults.hasIssues) {
    issuesWarning = `
⚠️ AUTOMATED CHECKS FOUND ISSUES:
${autoCheckResults.issues.slice(0, 5).join('\n')}
You MUST fix these issues before stopping.
`;
  }
  
  return `
STOP. 你声称完成了，请验证你的工作。
${issuesWarning}
验证步骤:
1. ls -la — 检查文件是否创建
2. cat/head — 检查文件内容是否真实
3. grep TODO/FIXME — 检查是否有未完成标记
4. grep NotImplementedError — 检查是否有骨架代码
5. 检查空文件 — stat.size == 0
6. 运行测试（如有）— 验证功能是否正确

如果验证失败，请修复问题后再退出。

工作目录: ${workspace || '当前目录'}
`;
}

/**
 * Gate 3允许退出消息
 * @returns {string}
 */
function getAllowExitMessage() {
  return `
验证通过，可以退出。

感谢你的工作。如果后续发现问题，可以继续修复。
`;
}

/**
 * 检查是否有工作
 * @param {string} workspace - 工作目录
 * @returns {boolean}
 */
function checkHasWork(workspace) {
  if (!workspace || !fs.existsSync(workspace)) {
    return false;
  }
  
  // 获取修改的文件
  const modifiedFiles = getModifiedFiles(workspace);
  if (modifiedFiles.length === 0) {
    return false;
  }
  
  // 检查是否有实际内容
  const hasRealContent = modifiedFiles.some(file => {
    const filePath = path.join(workspace, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 非空文件
      if (content.length < EMPTY_FILE_THRESHOLD) {
        return false;
      }
      
      // 非Skeleton文件
      if (detectSkeleton(content)) {
        return false;
      }
      
      return true;
    } catch (err) {
      return false;
    }
  });
  
  return hasRealContent;
}

/**
 * 获取修改的文件列表
 * @param {string} workspace - 工作目录
 * @returns {Array}
 */
function getModifiedFiles(workspace) {
  const files = [];
  
  // 遍历目录（排除隐藏文件和node_modules）
  const traverse = (dir) => {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules') {
        continue;
      }
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (stat.isFile()) {
        files.push(path.relative(workspace, fullPath));
      }
    }
  };
  
  traverse(workspace);
  return files;
}

/**
 * 检测Skeleton文件
 * @param {string} content - 文件内容
 * @returns {boolean}
 */
function detectSkeleton(content) {
  return SKELETON_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * 执行自动检查（来自 Harness Engineering - PreExitVerificationMiddleware._check_workspace_outputs）
 * @param {string} workspace - 工作目录
 * @returns {Object} 检查结果
 */
function autoCheck(workspace) {
  const results = {
    emptyFiles: [],
    skeletonFiles: [],
    todoMarkers: [],
    issues: []
  };
  
  if (!workspace || !fs.existsSync(workspace)) {
    return results;
  }
  
  const files = getModifiedFiles(workspace);
  
  for (const file of files) {
    const filePath = path.join(workspace, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stat = fs.statSync(filePath);
      
      // 空文件检测（0 bytes 或 <100 chars）
      if (stat.size === 0 || content.length < EMPTY_FILE_THRESHOLD) {
        results.emptyFiles.push(file);
        results.issues.push(`⚠️ ${file} exists but is EMPTY (0 bytes)`);
      }
      
      // Skeleton检测
      if (detectSkeleton(content)) {
        results.skeletonFiles.push(file);
        results.issues.push(`⚠️ ${file} contains TODO/NotImplementedError`);
      }
      
      // TODO标记检测
      if (SKELETON_PATTERNS.slice(0, 4).some(p => p.test(content))) {
        results.todoMarkers.push(file);
      }
      
      // Python 特定检测
      if (file.endsWith('.py')) {
        if (/^pass$/.test(content.trim())) {
          results.skeletonFiles.push(file);
          results.issues.push(`⚠️ ${file} is a stub file (only 'pass')`);
        }
      }
    } catch (err) {
      // 忽略读取错误
    }
  }
  
  // 统计问题总数
  results.totalIssues = results.issues.length;
  results.hasIssues = results.totalIssues > 0;
  
  return results;
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check') {
    const stateJson = args[1];
    
    if (!stateJson) {
      console.error('用法: node pre-exit-gate.js check <state_json>');
      process.exit(1);
    }
    
    try {
      const state = JSON.parse(stateJson);
      
      // 检查工作
      if (state.workspace) {
        state.hasWork = checkHasWork(state.workspace);
      }
      
      // 执行门控
      const result = preExitGate(state);
      
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('解析失败:', err.message);
      process.exit(1);
    }
  } else if (command === 'status') {
    console.log(JSON.stringify({
      gates: 3,
      skeletonPatterns: SKELETON_PATTERNS.length,
      emptyThreshold: EMPTY_FILE_THRESHOLD,
      version: '1.0.0'
    }, null, 2));
  } else if (command === 'test') {
    // 测试Gate 1
    const state1 = {hasWork: false, exit_attempts: 0};
    const result1 = preExitGate(state1);
    console.log('Gate 1测试:', result1.action === 'force_start' ? '✅' : '❌');
    
    // 测试Gate 2
    const state2 = {hasWork: true, exit_attempts: 1};
    const result2 = preExitGate(state2);
    console.log('Gate 2测试:', result2.action === 'force_verify' ? '✅' : '❌');
    
    // 测试Gate 3
    const state3 = {hasWork: true, exit_attempts: 2};
    const result3 = preExitGate(state3);
    console.log('Gate 3测试:', result3.action === 'allow_exit' ? '✅' : '❌');
    
    // Skeleton检测测试
    const skeletonContent = 'def foo():\n    pass\n    # TODO: implement';
    const skeletonDetected = detectSkeleton(skeletonContent);
    console.log('Skeleton测试:', skeletonDetected ? '✅' : '❌');
  } else {
    console.log(`
PreExit Gate - 三级门控机制

用法:
  node pre-exit-gate.js check <state_json>  执行门控检查
  node pre-exit-gate.js status              查看状态
  node pre-exit-gate.js test                运行测试

门控逻辑:
  Gate 1: 无工作 → 强制开始
  Gate 2: 有工作第1次退出 → 强制验证
  Gate 3: 已验证 → 允许退出

Skeleton检测模式:
  TODO, FIXME, NotImplementedError, pass, // ..., # ...

空文件阈值: 100 bytes
`);
  }
}

// 导出函数
module.exports = {
  preExitGate,
  checkHasWork,
  detectSkeleton,
  getModifiedFiles,
  autoCheck,
  SKELETON_PATTERNS,
  EMPTY_FILE_THRESHOLD
};

// CLI入口
if (require.main === module) {
  main();
}