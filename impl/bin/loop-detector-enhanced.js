#!/usr/bin/env node
/**
 * Loop Detection Enhanced - 增强循环检测
 * 
 * 检测Agent陷入循环的模式：
 * 1. 文件编辑 ≥4 次 → 强制重新思考
 * 2. 命令重复 ≥3 次 → Doom loop警告
 * 3. 连续失败 ≥3 次 → 诊断根因建议
 * 
 * 来源：Harness Engineering - LoopDetectionMiddleware
 * 
 * 用法：
 * node loop-detector-enhanced.js check <history_json>
 * node loop-detector-enhanced.js status
 */

const fs = require('fs');
const path = require('path');

// 检测阈值
const FILE_EDIT_THRESHOLD = 4;
const COMMAND_REPEAT_THRESHOLD = 3;
const ERROR_THRESHOLD = 3;

/**
 * 增强循环检测
 * @param {Object} history - 工具调用历史
 * @returns {Object} 检测结果
 */
function detectLoop(history) {
  const {fileEdits, commands, errors} = history;
  
  // 文件编辑循环检测
  const fileEditLoops = detectFileEditLoops(fileEdits);
  
  // 命令重复循环检测
  const commandLoops = detectCommandLoops(commands);
  
  // 错误循环检测
  const errorLoops = detectErrorLoops(errors);
  
  // 综合判断
  const hasLoop = fileEditLoops.detected || commandLoops.detected || errorLoops.detected;
  const severity = calculateSeverity(fileEditLoops, commandLoops, errorLoops);
  
  return {
    hasLoop,
    severity,
    fileEditLoops,
    commandLoops,
    errorLoops,
    recommendation: getRecommendation(fileEditLoops, commandLoops, errorLoops)
  };
}

/**
 * 检测文件编辑循环
 * @param {Array} fileEdits - 文件编辑历史 [{file, timestamp}]
 * @returns {Object} 检测结果
 */
function detectFileEditLoops(fileEdits) {
  if (!fileEdits || fileEdits.length === 0) {
    return {detected: false, count: 0, files: []};
  }
  
  // 统计每个文件的编辑次数
  const editCounts = {};
  for (const edit of fileEdits) {
    const file = edit.file;
    editCounts[file] = (editCounts[file] || 0) + 1;
  }
  
  // 检测超过阈值的文件
  const loopingFiles = [];
  for (const [file, count] of Object.entries(editCounts)) {
    if (count >= FILE_EDIT_THRESHOLD) {
      loopingFiles.push({file, count});
    }
  }
  
  return {
    detected: loopingFiles.length > 0,
    threshold: FILE_EDIT_THRESHOLD,
    loopingFiles,
    totalEdits: fileEdits.length
  };
}

/**
 * 检测命令重复循环
 * @param {Array} commands - 命令历史 [{command, timestamp}]
 * @returns {Object} 检测结果
 */
function detectCommandLoops(commands) {
  if (!commands || commands.length === 0) {
    return {detected: false, count: 0, patterns: []};
  }
  
  // 模糊匹配命令（忽略参数差异）
  const commandPatterns = {};
  for (const cmd of commands) {
    const pattern = normalizeCommand(cmd.command);
    commandPatterns[pattern] = (commandPatterns[pattern] || 0) + 1;
  }
  
  // 检测超过阈值的命令模式
  const loopingPatterns = [];
  for (const [pattern, count] of Object.entries(commandPatterns)) {
    if (count >= COMMAND_REPEAT_THRESHOLD) {
      loopingPatterns.push({pattern, count});
    }
  }
  
  return {
    detected: loopingPatterns.length > 0,
    threshold: COMMAND_REPEAT_THRESHOLD,
    loopingPatterns,
    totalCommands: commands.length
  };
}

/**
 * 检测错误循环
 * @param {Array} errors - 错误历史 [{error, timestamp}]
 * @returns {Object} 检测结果
 */
function detectErrorLoops(errors) {
  if (!errors || errors.length === 0) {
    return {detected: false, count: 0, patterns: []};
  }
  
  // 统计连续相同错误
  const recentErrors = errors.slice(-ERROR_THRESHOLD * 2);
  const errorPatterns = {};
  
  for (const err of recentErrors) {
    const pattern = normalizeError(err.error);
    errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;
  }
  
  // 检测超过阈值的错误模式
  const loopingErrors = [];
  for (const [pattern, count] of Object.entries(errorPatterns)) {
    if (count >= ERROR_THRESHOLD) {
      loopingErrors.push({pattern, count});
    }
  }
  
  return {
    detected: loopingErrors.length > 0,
    threshold: ERROR_THRESHOLD,
    loopingErrors,
    totalErrors: errors.length
  };
}

/**
 * 规范化命令（模糊匹配）
 * @param {string} command - 原始命令
 * @returns {string} 规范化命令
 */
function normalizeCommand(command) {
  // 移除参数，只保留命令名和主要结构
  return command
    .split(' ')[0]  // 基础命令
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 规范化错误（提取关键信息）
 * @param {string} error - 原始错误
 * @returns {string} 规范化错误
 */
function normalizeError(error) {
  // 提取错误类型
  const errorTypes = [
    /Error:/i,
    /Exception:/i,
    /Failed:/i,
    /timeout/i,
    /not found/i,
    /permission denied/i
  ];
  
  for (const pattern of errorTypes) {
    if (pattern.test(error)) {
      return pattern.source.replace(/[\\\/]/g, '');
    }
  }
  
  return 'unknown_error';
}

/**
 * 计算严重程度
 * @param {Object} fileEditLoops - 文件编辑循环结果
 * @param {Object} commandLoops - 命令循环结果
 * @param {Object} errorLoops - 错误循环结果
 * @returns {number} 严重程度（0-3）
 */
function calculateSeverity(fileEditLoops, commandLoops, errorLoops) {
  let severity = 0;
  
  if (fileEditLoops.detected) severity += 2;
  if (commandLoops.detected) severity += 1;
  if (errorLoops.detected) severity += 2;
  
  return Math.min(severity, 3);
}

/**
 * 获取推荐操作
 * @param {Object} fileEditLoops - 文件编辑循环结果
 * @param {Object} commandLoops - 命令循环结果
 * @param {Object} errorLoops - 命令循环结果
 * @returns {string} 推荐信息
 */
function getRecommendation(fileEditLoops, commandLoops, errorLoops) {
  const recommendations = [];
  
  if (fileEditLoops.detected) {
    recommendations.push(`文件编辑循环: ${fileEditLoops.loopingFiles.map(f => `${f.file}(${f.count}次)`).join(', ')}\n建议: STOP，重新思考方法。你可能陷入了反复修改同一文件的循环。`);
  }
  
  if (commandLoops.detected) {
    recommendations.push(`命令重复循环: ${commandLoops.loopingPatterns.map(p => `${p.pattern}(${p.count}次)`).join(', ')}\n建议: Doom loop检测。尝试不同的命令或方法。`);
  }
  
  if (errorLoops.detected) {
    recommendations.push(`错误循环: ${errorLoops.loopingErrors.map(e => `${e.pattern}(${e.count}次)`).join(', ')}\n建议: ROOT CAUSE诊断。不要重复相同操作，分析根本原因。`);
  }
  
  return recommendations.join('\n\n') || '未检测到循环模式，继续正常工作。';
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check') {
    const historyJson = args[1];
    
    if (!historyJson) {
      console.error('用法: node loop-detector-enhanced.js check <history_json>');
      process.exit(1);
    }
    
    try {
      const history = JSON.parse(historyJson);
      const result = detectLoop(history);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('解析失败:', err.message);
      process.exit(1);
    }
  } else if (command === 'status') {
    console.log(JSON.stringify({
      thresholds: {
        fileEdit: FILE_EDIT_THRESHOLD,
        commandRepeat: COMMAND_REPEAT_THRESHOLD,
        error: ERROR_THRESHOLD
      },
      version: '2.0.0-enhanced'
    }, null, 2));
  } else if (command === 'test') {
    // 测试文件编辑循环
    const history1 = {
      fileEdits: [
        {file: 'test.py', timestamp: 1},
        {file: 'test.py', timestamp: 2},
        {file: 'test.py', timestamp: 3},
        {file: 'test.py', timestamp: 4},
        {file: 'test.py', timestamp: 5}
      ],
      commands: [],
      errors: []
    };
    const result1 = detectLoop(history1);
    console.log('文件编辑循环测试:', result1.fileEditLoops.detected ? '✅' : '❌');
    
    // 测试命令循环
    const history2 = {
      fileEdits: [],
      commands: [
        {command: 'ls', timestamp: 1},
        {command: 'ls', timestamp: 2},
        {command: 'ls', timestamp: 3}
      ],
      errors: []
    };
    const result2 = detectLoop(history2);
    console.log('命令循环测试:', result2.commandLoops.detected ? '✅' : '❌');
    
    // 测试错误循环
    const history3 = {
      fileEdits: [],
      commands: [],
      errors: [
        {error: 'Error: timeout', timestamp: 1},
        {error: 'Error: timeout', timestamp: 2},
        {error: 'Error: timeout', timestamp: 3}
      ]
    };
    const result3 = detectLoop(history3);
    console.log('错误循环测试:', result3.errorLoops.detected ? '✅' : '❌');
  } else {
    console.log(`
Loop Detection Enhanced - 增强循环检测

用法:
  node loop-detector-enhanced.js check <history_json>  检测循环
  node loop-detector-enhanced.js status                查看阈值
  node loop-detector-enhanced.js test                  运行测试

检测阈值:
  文件编辑 ≥4 次 → 强制重新思考
  命令重复 ≥3 次 → Doom loop警告
  连续失败 ≥3 次 → 诊断根因建议
`);
  }
}

// 导出函数
module.exports = {
  detectLoop,
  detectFileEditLoops,
  detectCommandLoops,
  detectErrorLoops,
  normalizeCommand,
  normalizeError,
  calculateSeverity,
  getRecommendation,
  FILE_EDIT_THRESHOLD,
  COMMAND_REPEAT_THRESHOLD,
  ERROR_THRESHOLD
};

// CLI入口
if (require.main === module) {
  main();
}