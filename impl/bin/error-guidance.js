#!/usr/bin/env node
/**
 * Error Guidance - 错误指导中间件
 * 
 * 检测常见错误并提供修复建议，避免重复相同指导
 * 
 * 来源：Harness Engineering - ErrorGuidanceMiddleware
 * 
 * 错误模式：
 * - command not found → apt-get install
 * - permission denied → chmod/sudo
 * - timeout → 增加timeout参数
 * - ...（12个预置模式）
 * 
 * 用法：
 * node error-guidance.js detect <error_message>
 * node error-guidance.js status
 */

const fs = require('fs');
const path = require('path');

// 预置错误模式（来自Harness Engineering）
const ERROR_PATTERNS = [
  {
    pattern: /command not found/i,
    type: 'missing_command',
    suggestion: 'The command is not installed. Try:\n1. Check if the tool exists: which <command>\n2. Install if missing: apt-get install <package>\n3. Or use alternative tool',
    example: 'command not found: ffmpeg → apt-get install ffmpeg'
  },
  {
    pattern: /permission denied/i,
    type: 'permission',
    suggestion: 'Permission denied. Try:\n1. Check file permissions: ls -la <file>\n2. Add permissions: chmod +x <file>\n3. Or run with sudo: sudo <command>',
    example: 'permission denied: ./script.sh → chmod +x script.sh'
  },
  {
    pattern: /timeout|timed out/i,
    type: 'timeout',
    suggestion: 'Operation timed out. Try:\n1. Increase timeout parameter: timeout=60\n2. Check if process is hanging\n3. Run in background with polling',
    example: 'timeout: run_bash → run_bash(timeout=120)'
  },
  {
    pattern: /no such file or directory|file not found/i,
    type: 'file_missing',
    suggestion: 'File does not exist. Try:\n1. Check path: ls -la <path>\n2. Verify working directory: pwd\n3. Create file if needed: touch <file>',
    example: 'file not found: output.txt → check with ls -la'
  },
  {
    pattern: /connection refused|connection failed/i,
    type: 'connection',
    suggestion: 'Connection failed. Try:\n1. Check if service is running: ss -tlnp | grep <port>\n2. Start service if needed\n3. Verify correct host/port',
    example: 'connection refused: localhost:8080 → start server'
  },
  {
    pattern: /memory|out of memory|oom/i,
    type: 'memory',
    suggestion: 'Memory exhausted. Try:\n1. Reduce parallelism: make -j2 instead of -j$(nproc)\n2. Add swap space if allowed\n3. Check memory usage: free -h',
    example: 'OOM: make all → make -j2'
  },
  {
    pattern: /syntax error|parse error/i,
    type: 'syntax',
    suggestion: 'Syntax error. Try:\n1. Check syntax manually\n2. Use linter/formatter\n3. Read error line number carefully',
    example: 'syntax error: Python → check indentation'
  },
  {
    pattern: /import error|module not found|cannot find module/i,
    type: 'import',
    suggestion: 'Module not found. Try:\n1. Install dependency: pip install <module>\n2. Check Python version compatibility\n3. Verify import path',
    example: 'ModuleNotFoundError: numpy → pip install numpy'
  },
  {
    pattern: /ssl|certificate|tls/i,
    type: 'ssl',
    suggestion: 'SSL/Certificate error. Try:\n1. Disable SSL verification temporarily\n2. Update certificates: apt-get install ca-certificates\n3. Use insecure flag if appropriate',
    example: 'SSL error: curl → curl -k'
  },
  {
    pattern: /disk full|no space left/i,
    type: 'disk',
    suggestion: 'Disk full. Try:\n1. Check disk usage: df -h\n2. Clean temporary files: rm -rf /tmp/*\n3. Compress large files',
    example: 'disk full → df -h, rm -rf /tmp/*'
  },
  {
    pattern: /port already in use|address already in use/i,
    type: 'port',
    suggestion: 'Port already in use. Try:\n1. Check what is using port: ss -tlnp | grep <port>\n2. Kill process: kill <pid>\n3. Use different port',
    example: 'port 8080 in use → kill process or use 8081'
  },
  {
    pattern: /git|repository|branch/i,
    type: 'git',
    suggestion: 'Git error. Try:\n1. Check repository status: git status\n2. Pull latest changes: git pull\n3. Resolve conflicts if any',
    example: 'git error → git status, git pull'
  }
];

// 已发送指导记录（防止重复）
const GUIDANCE_HISTORY = [];

/**
 * 检测错误并提供指导
 * @param {string} errorMessage - 错误消息
 * @returns {Object} 检测结果和建议
 */
function detectError(errorMessage) {
  const matches = [];
  
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(errorMessage)) {
      matches.push({
        type: pattern.type,
        pattern: pattern.pattern.source,
        suggestion: pattern.suggestion,
        example: pattern.example
      });
    }
  }
  
  if (matches.length === 0) {
    return {
      detected: false,
      suggestion: 'No specific guidance available. General approach:\n1. Read error message carefully\n2. Identify root cause\n3. Try different approach\n4. Search for solution if needed'
    };
  }
  
  // 选择最匹配的指导
  const bestMatch = matches[0];
  
  // 检查是否已发送过相同指导
  const alreadySent = GUIDANCE_HISTORY.some(h =>
    h.type === bestMatch.type &&
    Date.now() - h.timestamp < 60000  // 1分钟内
  );
  
  if (alreadySent) {
    return {
      detected: true,
      matches,
      bestMatch,
      alreadySent: true,
      suggestion: 'Same guidance already provided recently. Try a different approach.'
    };
  }
  
  // 记录已发送
  GUIDANCE_HISTORY.push({
    type: bestMatch.type,
    timestamp: Date.now()
  });
  
  return {
    detected: true,
    matches,
    bestMatch,
    alreadySent: false,
    suggestion: formatSuggestion(bestMatch)
  };
}

/**
 * 格式化建议
 * @param {Object} match - 匹配结果
 * @returns {string} 格式化建议
 */
function formatSuggestion(match) {
  return `
[ERROR GUIDANCE] ${match.type}

${match.suggestion}

Example: ${match.example}

---
Do not retry the identical action. Analyze the root cause first.
`;
}

/**
 * 获取历史记录
 * @returns {Array} 指导历史
 */
function getGuidanceHistory() {
  return GUIDANCE_HISTORY.slice(-20);  // 最近20条
}

/**
 * 清空历史记录
 */
function clearHistory() {
  GUIDANCE_HISTORY.length = 0;
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'detect') {
    const errorMessage = args[1];
    
    if (!errorMessage) {
      console.error('用法: node error-guidance.js detect <error_message>');
      process.exit(1);
    }
    
    const result = detectError(errorMessage);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.detected && !result.alreadySent) {
      console.log('\n' + result.suggestion);
    }
    
  } else if (command === 'status') {
    console.log(JSON.stringify({
      patterns: ERROR_PATTERNS.length,
      history: GUIDANCE_HISTORY.length,
      types: ERROR_PATTERNS.map(p => p.type),
      version: '1.0.0'
    }, null, 2));
    
  } else if (command === 'history') {
    const history = getGuidanceHistory();
    console.log(JSON.stringify(history, null, 2));
    
  } else if (command === 'test') {
    // 测试检测
    const testError1 = 'bash: ffmpeg: command not found';
    const result1 = detectError(testError1);
    console.log('command not found测试:', result1.detected && result1.bestMatch.type === 'missing_command' ? '✅' : '❌');
    
    const testError2 = 'Permission denied: ./script.sh';
    const result2 = detectError(testError2);
    console.log('permission denied测试:', result2.detected && result2.bestMatch.type === 'permission' ? '✅' : '❌');
    
    const testError3 = 'Timeout exceeded (30s)';
    const result3 = detectError(testError3);
    console.log('timeout测试:', result3.detected && result3.bestMatch.type === 'timeout' ? '✅' : '❌');
    
    // 测试重复检测
    detectError(testError1);
    const result4 = detectError(testError1);
    console.log('重复检测测试:', result4.alreadySent ? '✅' : '❌');
    
  } else {
    console.log(`
Error Guidance - 错误指导

用法:
  node error-guidance.js detect <error_message>  检测错误
  node error-guidance.js status                  查看状态
  node error-guidance.js history                 查看历史
  node error-guidance.js test                    运行测试

错误模式 (${ERROR_PATTERNS.length}个):
  command not found → apt-get install
  permission denied → chmod/sudo
  timeout → 增加timeout参数
  file not found → 检查路径
  connection refused → 启动服务
  memory exhausted → 减少并行度
  syntax error → 检查语法
  module not found → pip install
  ssl error → 更新证书
  disk full → 清理空间
  port in use → kill进程
  git error → git status
`);
  }
}

// 导出函数
module.exports = {
  detectError,
  formatSuggestion,
  getGuidanceHistory,
  clearHistory,
  ERROR_PATTERNS
};

// CLI入口
if (require.main === module) {
  main();
}