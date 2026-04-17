#!/usr/bin/env node
/**
 * Smart Truncate - 智能截断工具输出
 * 
 * 防止工具输出撑爆上下文，保留关键信息
 * 
 * 来源：Harness Engineering - tools.py smart_truncate()
 * 
 * 预算分配：
 * - stderr: 40%优先（错误信息最重要）
 * - stdout: 60% = head 40% + tail 40% + important-middle 20%
 * 
 * 大输出持久化：
 * - >50k chars → 写入 _tool_output_{name}.txt
 * - 返回2000 chars preview + 文件路径提示
 * 
 * 用法：
 * node smart-truncate.js truncate <output> [limit]
 * node smart-truncate.js persist <output> <filename>
 */

const fs = require('fs');
const path = require('path');

// 默认限制
const DEFAULT_LIMIT = 50000;
const PREVIEW_LIMIT = 2000;

// 重要行模式（错误关键词）
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

/**
 * 智能截断输出
 * @param {string} output - 原始输出
 * @param {number} limit - 字符限制
 * @returns {string} 截断后的输出
 */
function smartTruncate(output, limit = DEFAULT_LIMIT) {
  if (output.length <= limit) {
    return output;
  }
  
  // 分离stderr和stdout
  const {stderr, stdout} = splitOutput(output);
  
  // 预算分配
  const stderr_budget = limit * 0.4;
  const stdout_budget = limit * 0.6;
  const head_budget = stdout_budget * 0.4;
  const tail_budget = stdout_budget * 0.4;
  const middle_budget = stdout_budget * 0.2;
  
  // stderr处理（优先保留）
  const stderr_lines = stderr.split('\n');
  const stderr_result = truncateHead(stderr_lines, stderr_budget);
  
  // stdout处理
  const stdout_lines = stdout.split('\n');
  
  // head部分
  const head_result = truncateHead(stdout_lines, head_budget);
  
  // tail部分
  const tail_result = truncateTail(stdout_lines, tail_budget);
  
  // important middle部分
  const important_middle = extractImportant(stdout_lines, middle_budget);
  
  // 组合结果
  const parts = [];
  
  if (stderr_result.content) {
    parts.push('=== STDERR ===\n' + stderr_result.content);
  }
  
  if (head_result.content) {
    parts.push('=== STDOUT HEAD ===\n' + head_result.content);
  }
  
  if (important_middle.content) {
    parts.push('=== IMPORTANT LINES ===\n' + important_middle.content);
  }
  
  if (tail_result.content) {
    parts.push('=== STDOUT TAIL ===\n' + tail_result.content);
  }
  
  // 添加截断信息
  const truncatedInfo = `\n\n[TRUNCATED] Original: ${output.length} chars → Truncated: ${limit} chars (${Math.round(limit/output.length*100)}%)`;
  
  return parts.join('\n\n') + truncatedInfo;
}

/**
 * 分离stderr和stdout
 * @param {string} output - 原始输出
 * @returns {Object} {stderr, stdout}
 */
function splitOutput(output) {
  // 简单分离：假设stderr有特定标记或格式
  // 实际实现需要根据工具输出格式
  
  // 尝试检测常见stderr标记
  const stderrMarkers = ['[stderr]', '[error]', 'stderr:', 'error:'];
  let stderr = '';
  let stdout = output;
  
  for (const marker of stderrMarkers) {
    if (output.includes(marker)) {
      const parts = output.split(marker);
      if (parts.length >= 2) {
        stderr = parts.slice(1).join(marker);
        stdout = parts[0];
        break;
      }
    }
  }
  
  // 如果没有明确标记，使用重要行作为stderr
  if (!stderr) {
    const lines = output.split('\n');
    const stderrLines = lines.filter(line => 
      IMPORTANT_PATTERNS.some(p => p.test(line))
    );
    
    if (stderrLines.length > lines.length * 0.1) {
      // 超过10%是错误行，分离出来
      stderr = stderrLines.join('\n');
      stdout = lines.filter(line => !stderrLines.includes(line)).join('\n');
    }
  }
  
  return {stderr, stdout};
}

/**
 * 截取头部
 * @param {Array} lines - 行数组
 * @param {number} budget - 字符预算
 * @returns {Object} {content, lines_used}
 */
function truncateHead(lines, budget) {
  const selected = [];
  let totalChars = 0;
  
  for (const line of lines) {
    if (totalChars + line.length + 1 > budget) break;
    selected.push(line);
    totalChars += line.length + 1;
  }
  
  return {
    content: selected.join('\n'),
    lines_used: selected.length,
    total_lines: lines.length
  };
}

/**
 * 截取尾部
 * @param {Array} lines - 行数组
 * @param {number} budget - 字符预算
 * @returns {Object} {content, lines_used}
 */
function truncateTail(lines, budget) {
  const selected = [];
  let totalChars = 0;
  
  // 从尾部开始
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (totalChars + line.length + 1 > budget) break;
    selected.unshift(line);
    totalChars += line.length + 1;
  }
  
  return {
    content: selected.join('\n'),
    lines_used: selected.length,
    total_lines: lines.length
  };
}

/**
 * 提取重要行
 * @param {Array} lines - 行数组
 * @param {number} budget - 字符预算
 * @returns {Object} {content, important_count}
 */
function extractImportant(lines, budget) {
  const important = lines.filter(line =>
    IMPORTANT_PATTERNS.some(p => p.test(line))
  );
  
  // 按预算截断
  const selected = [];
  let totalChars = 0;
  
  for (const line of important) {
    if (totalChars + line.length + 1 > budget) break;
    selected.push(line);
    totalChars += line.length + 1;
  }
  
  return {
    content: selected.join('\n'),
    important_count: selected.length,
    total_important: important.length
  };
}

/**
 * 持久化大输出
 * @param {string} output - 原始输出
 * @param {string} workspace - 工作目录
 * @param {string} toolName - 工具名称
 * @returns {Object} {preview, filePath, truncated}
 */
function persistOutput(output, workspace, toolName) {
  const outputDir = path.join(workspace, '_tool_outputs');
  
  // 创建目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {recursive: true});
  }
  
  // 生成文件名
  const timestamp = Date.now();
  const fileName = `${toolName}_${timestamp}.txt`;
  const filePath = path.join(outputDir, fileName);
  
  // 写入完整输出
  fs.writeFileSync(filePath, output, 'utf8');
  
  // 生成preview
  const preview = output.slice(0, PREVIEW_LIMIT);
  const truncated = output.length > PREVIEW_LIMIT;
  
  return {
    preview,
    filePath,
    fileName,
    truncated,
    originalSize: output.length,
    previewSize: preview.length
  };
}

/**
 * 处理工具输出
 * @param {string} output - 原始输出
 * @param {Object} options - 配置选项
 * @returns {Object} 处理结果
 */
function processOutput(output, options = {}) {
  const {workspace, toolName, limit = DEFAULT_LIMIT} = options;
  
  // 小输出：直接返回
  if (output.length <= limit) {
    return {
      content: output,
      truncated: false,
      persisted: false
    };
  }
  
  // 大输出：截断 + 持久化
  const truncated = smartTruncate(output, limit);
  
  if (workspace && toolName) {
    const persisted = persistOutput(output, workspace, toolName);
    
    return {
      content: truncated,
      truncated: true,
      persisted: true,
      filePath: persisted.filePath,
      preview: persisted.preview,
      originalSize: persisted.originalSize
    };
  }
  
  return {
    content: truncated,
    truncated: true,
    persisted: false,
    originalSize: output.length
  };
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'truncate') {
    const output = args[1];
    const limit = parseInt(args[2]) || DEFAULT_LIMIT;
    
    if (!output) {
      console.error('用法: node smart-truncate.js truncate <output> [limit]');
      process.exit(1);
    }
    
    const result = smartTruncate(output, limit);
    console.log(result);
    
  } else if (command === 'persist') {
    const output = args[1];
    const workspace = args[2] || process.cwd();
    const toolName = args[3] || 'tool';
    
    if (!output) {
      console.error('用法: node smart-truncate.js persist <output> [workspace] [toolName]');
      process.exit(1);
    }
    
    const result = persistOutput(output, workspace, toolName);
    console.log(JSON.stringify(result, null, 2));
    console.log(`\n✅ 输出已保存: ${result.filePath}`);
    
  } else if (command === 'test') {
    // 测试模式
    let largeOutput = Array(1000).fill('This is a test line with some content').join('\n');
    largeOutput += '\nerror: something went wrong\nwarning: be careful';
    
    const result = smartTruncate(largeOutput, 5000);
    
    console.log('原始大小:', largeOutput.length);
    console.log('截断后大小:', result.length);
    console.log('包含重要行:', IMPORTANT_PATTERNS.some(p => p.test(result)));
    
    if (result.length < largeOutput.length) {
      console.log('\n✅ 截断成功（测试通过）');
    } else {
      console.log('\n❌ 截断失败（测试未通过）');
    }
    
  } else {
    console.log(`
Smart Truncate - 智能截断工具输出

用法:
  node smart-truncate.js truncate <output> [limit]  截断输出
  node smart-truncate.js persist <output> [workspace] [toolName]  持久化输出
  node smart-truncate.js test                       运行测试

预算分配:
  stderr: 40%优先（错误信息最重要）
  stdout: 60% = head 40% + tail 40% + important-middle 20%

重要关键词:
  error, warning, fail, assert, traceback, exception, crash, abort, fatal

大输出持久化:
  >50k chars → 写入 _tool_output_{name}.txt
  返回2000 chars preview + 文件路径提示
`);
  }
}

// 导出函数
module.exports = {
  smartTruncate,
  splitOutput,
  truncateHead,
  truncateTail,
  extractImportant,
  persistOutput,
  processOutput,
  DEFAULT_LIMIT,
  PREVIEW_LIMIT,
  IMPORTANT_PATTERNS
};

// CLI入口
if (require.main === module) {
  main();
}