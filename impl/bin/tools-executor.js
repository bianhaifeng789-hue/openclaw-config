#!/usr/bin/env node
/**
 * Tools Executor - 直接翻译自 tools.py
 *
 * 核心功能:
 * - executeTool(name, args) - 统一工具执行入口
 * - read_file/write_file/edit_file/list_files - 文件操作
 * - run_bash - Shell 命令执行
 * - delegate_task - 子代理派发（上下文隔离）
 * - browser_test - Playwright 测试
 * - web_search/web_fetch - 网络搜索
 * - smart_truncate - 保留错误行的截断
 * - _validate_and_fix - 自动修正常见错误
 *
 * 用法:
 *   node tools-executor.js execute <name> <args_json>
 *   node tools-executor.js list
 *   node tools-executor.js test
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// 动态路径
const HOME = process.env.HOME || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');

// ---------------------------------------------------------------------------
// 工具注册表
// ---------------------------------------------------------------------------

const TOOLS_REGISTRY = {
  // 文件操作
  read_file: { handler: readFile, timeout: 30000 },
  read_skill_file: { handler: readSkillFile, timeout: 30000 },  // 新增: skills 目录读取
  write_file: { handler: writeFile, timeout: 30000 },
  edit_file: { handler: editFile, timeout: 30000 },
  list_files: { handler: listFiles, timeout: 10000 },
  
  // Shell 命令
  run_bash: { handler: runBash, timeout: 300000 },
  
  // 子代理
  delegate_task: { handler: delegateTask, timeout: 600000 },
  
  // 浏览器测试
  browser_test: { handler: browserTest, timeout: 120000 },
  stop_dev_server: { handler: stopDevServer, timeout: 5000 },  // 新增: 停止开发服务器
  
  // 网络搜索
  web_search: { handler: webSearch, timeout: 30000 },
  web_fetch: { handler: webFetch, timeout: 30000 },
  
  // 工具辅助
  smart_truncate: { handler: smartTruncate, timeout: 1000 },
  validate_and_fix: { handler: validateAndFix, timeout: 1000 }
};

// Dev server 进程引用（全局）
let devServerProc = null;

// ---------------------------------------------------------------------------
// 统一执行入口
// ---------------------------------------------------------------------------

/**
 * 执行工具调用
 * @param {string} name - 工具名称
 * @param {Object} args - 工具参数
 * @returns {string} 执行结果
 */
async function executeTool(name, args) {
  // 检查工具是否存在
  const tool = TOOLS_REGISTRY[name];
  if (!tool) {
    return formatError(`Unknown tool: ${name}. Available tools: ${Object.keys(TOOLS_REGISTRY).join(', ')}`);
  }
  
  // 验证参数
  const validation = validateArgs(name, args);
  if (!validation.valid) {
    return formatError(`Invalid arguments for ${name}: ${validation.error}`);
  }
  
  // 自动修正
  args = autoFixArgs(name, args);
  
  // 检查阻塞性警告
  if (args._warning && args._warning.startsWith('[auto-fix] Empty')) {
    return args._warning;  // 空参数，直接返回错误
  }
  if (args._warning && args._warning.includes('interactive command')) {
    return args._warning;  // 交互式命令，直接返回错误
  }
  
  // 执行
  try {
    const startTime = Date.now();
    let result = await tool.handler(args, tool.timeout);
    const elapsed = Date.now() - startTime;
    
    // 大结果持久化（Claude Code pattern）
    if (result && result.length > 50000 && name === 'run_bash') {
      result = persistLargeResult(result, name);
    }
    
    // 截断过长结果
    const truncated = smartTruncateResult(result, name);
    
    // 添加自动修正警告
    if (args._warning) {
      result = `${args._warning}\n\n${truncated}`; 
    }
    
    // 记录日志
    logToolCall(name, args, truncated, elapsed);
    
    return result;
  } catch (err) {
    return formatError(`${name} failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 文件操作工具
// ---------------------------------------------------------------------------

/**
 * 读取文件
 */
async function readFile(args) {
  const filePath = resolvePath(args.path);
  
  if (!fs.existsSync(filePath)) {
    return formatError(`File not found: ${args.path}`);
  }
  
  const stat = fs.statSync(filePath);
  
  // 大文件警告
  if (stat.size > 1024 * 1024) {
    return formatError(`File too large (${Math.round(stat.size / 1024)}KB). Use offset/limit for large files.`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 截断显示
  if (content.length > 50000) {
    return content.slice(0, 50000) + '\n... [truncated, file has ' + content.length + ' chars]';
  }
  
  return content;
}

/**
 * 读取 Skill 文件（来自 skills 目录）
 * 来源：Harness Engineering - tools.py read_skill_file()
 */
async function readSkillFile(args) {
  const skillPath = args.path;
  
  if (!skillPath) {
    return formatError('read_skill_file requires path');
  }
  
  // Skills 目录位置
  const skillsDir = path.resolve(__dirname, '../../skills');
  const filePath = path.resolve(skillsDir, skillPath);
  
  // 安全检查：必须在 skills 目录内
  if (!filePath.startsWith(skillsDir)) {
    return formatError(`Path must be inside skills/ directory: ${skillPath}`);
  }
  
  if (!fs.existsSync(filePath)) {
    return formatError(`Skill file not found: ${skillPath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 截断到 60KB
  if (content.length > 60000) {
    return content.slice(0, 60000) + '\n... [truncated]';
  }
  
  return content;
}

/**
 * 写入文件
 */
async function writeFile(args) {
  const filePath = resolvePath(args.path);
  const content = args.content || '';
  
  // 创建目录
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  
  return `File written: ${args.path} (${content.length} chars)`;
}

/**
 * 编辑文件 - 精确替换
 */
async function editFile(args) {
  const filePath = resolvePath(args.path);
  
  if (!fs.existsSync(filePath)) {
    return formatError(`File not found: ${args.path}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const oldText = args.old_text || args.oldText;
  const newText = args.new_text || args.newText;
  
  if (!oldText) {
    return formatError('edit_file requires old_text to replace');
  }
  
  // 检查是否存在
  if (!content.includes(oldText)) {
    return formatError(`old_text not found in file: ${oldText.slice(0, 100)}...`);
  }
  
  // 检查唯一性
  const occurrences = content.split(oldText).length - 1;
  if (occurrences > 1) {
    return formatError(`old_text appears ${occurrences} times. Must be unique.`);
  }
  
  // 替换
  const newContent = content.replace(oldText, newText || '');
  fs.writeFileSync(filePath, newContent, 'utf8');
  
  return `File edited: ${args.path} (replaced 1 occurrence, ${newContent.length - content.length} chars diff)`;
}

/**
 * 列出文件
 */
async function listFiles(args) {
  const dirPath = resolvePath(args.directory || args.path || '.');
  
  if (!fs.existsSync(dirPath)) {
    return formatError(`Directory not found: ${args.directory || args.path}`);
  }
  
  const files = [];
  const traverse = (dir, prefix = '') => {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      // 跳过隐藏和node_modules
      if (item.startsWith('.') || item === 'node_modules' || item === '__pycache__') {
        continue;
      }
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      const relPath = prefix + item;
      
      if (stat.isDirectory()) {
        files.push(`${relPath}/`);
        traverse(fullPath, relPath + '/');
      } else {
        files.push(`${relPath} (${Math.round(stat.size / 1024)}KB)`);
      }
    }
  };
  
  traverse(dirPath);
  
  if (files.length > 200) {
    return files.slice(0, 200).join('\n') + '\n... [truncated, ' + files.length + ' total files]';
  }
  
  return files.join('\n') || '(empty directory)';
}

// ---------------------------------------------------------------------------
// Shell 命令工具
// ---------------------------------------------------------------------------

/**
 * 执行 Shell 命令
 */
async function runBash(args, timeout = 300000) {
  const command = args.command;
  const workdir = resolvePath(args.workdir || args.cwd || '.');
  
  if (!command) {
    return formatError('run_bash requires command');
  }
  
  // 安全检查
  const blockedPatterns = [
    /rm -rf \//,  // 防止删除根目录
    /sudo/,       // 禁止sudo
    /mkfs/,       // 禁止格式化
    /dd if=/,     // 禁止dd写入
    />\s*\//,     // 禁止写入根目录
    /curl.*\|.*bash/,  // 禁止远程执行
  ];
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(command)) {
      return formatError(`Blocked dangerous command pattern: ${pattern}`);
    }
  }
  
  try {
    const result = execSync(command, {
      cwd: workdir,
      encoding: 'utf8',
      timeout: timeout,
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return result || '(empty output)';
  } catch (err) {
    // 返回错误但包含输出
    const output = err.stdout || err.stderr || err.message;
    return `Command failed (exit ${err.status || 'unknown'}):\n${output}`;
  }
}

// ---------------------------------------------------------------------------
// 子代理派发
// ---------------------------------------------------------------------------

/**
 * 派发任务给子代理（上下文隔离）
 * 来源：Harness Engineering - tools.py delegate_task()
 * 实现：调用 sessions_spawn 进行真实派发
 */
async function delegateTask(args) {
  const agentId = args.agent_id || args.agentId || 'builder';
  const task = args.task || args.prompt;
  const context = args.context || '';
  
  if (!task) {
    return formatError('delegate_task requires task/prompt');
  }
  
  // 构建完整任务描述
  const fullTask = context ?
    `Context: ${context}\n\nTask: ${task}` :
    task;
  
  try {
    // 尝试调用真实的 sessions_spawn（如果可用）
    // 检查是否有 OpenClaw runtime
    if (global.sessions_spawn) {
      const result = await global.sessions_spawn({
        agentId,
        task: fullTask,
        runtime: 'subagent',
        mode: 'run',
        timeoutSeconds: 120
      });
      
      if (result && result.output) {
        // 截断结果到 8KB
        const output = result.output;
        if (output.length > 8000) {
          return output.slice(0, 8000) + '\n...(truncated)';
        }
        return output;
      }
      
      return '[sub-agent returned no output]';
    }
    
    // Fallback: 使用 child_process 调用 agent-loop.js
    const agentScript = path.join(__dirname, 'agent-loop.js');
    if (fs.existsSync(agentScript)) {
      const result = execSync(
        `node ${agentScript} run --prompt="${fullTask.replace(/"/g, '\\"').slice(0, 500)}" --profile=${agentId}`,
        { encoding: 'utf8', timeout: 120000, cwd: WORKSPACE }
      );
      
      if (result && result.length > 8000) {
        return result.slice(0, 8000) + '\n...(truncated)';
      }
      return result || '[sub-agent returned no output]';
    }
    
    // 最后 fallback: 返回 mock
    return `[Sub-agent ${agentId} spawned (mock mode)]\nTask: ${task.slice(0, 200)}...\n\nNote: sessions_spawn not available. Install OpenClaw runtime for real delegation.`;
  } catch (err) {
    return formatError(`delegate_task failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 浏览器测试
// ---------------------------------------------------------------------------

/**
 * Playwright 浏览器测试
 * 来源：Harness Engineering - tools.py browser_test()
 * 实现：调用 browser-test.js 进行真实测试
 */
async function browserTest(args) {
  const url = args.url;
  const actions = args.actions || [];
  const screenshot = args.screenshot !== false;
  const startCommand = args.start_command || args.startCommand;
  const port = args.port || 5173;
  const startupWait = args.startup_wait || args.startupWait || 8;
  
  if (!url) {
    return formatError('browser_test requires url');
  }
  
  try {
    // 调用真实的 browser-test.js
    const browserTestScript = path.join(__dirname, 'browser-test.js');
    
    if (fs.existsSync(browserTestScript)) {
      // 构建 JSON 参数
      const testArgs = JSON.stringify({
        url,
        actions,
        screenshot,
        start_command: startCommand,
        port,
        startup_wait: startupWait
      });
      
      // 执行测试脚本
      const result = execSync(
        `node ${browserTestScript} --json '${testArgs}'`,
        { encoding: 'utf8', timeout: 120000, cwd: WORKSPACE }
      );
      
      // 返回结果
      if (result && result.length > 30000) {
        return smartTruncateOutput(result, '', 30000);
      }
      return result || '[browser test returned no output]';
    }
    
    // Fallback: 返回简化测试结果
    const report = [
      `[Browser Test - ${url}]`,
      `Actions: ${actions.length || 0}`,
      `Screenshot: ${screenshot ? 'yes' : 'no'}`,
      '',
      'Note: browser-test.js not found. Install Playwright for real testing.',
      'npm install playwright && npx playwright install chromium'
    ].join('\n');
    
    return report;
  } catch (err) {
    return formatError(`browser_test failed: ${err.message}`);
  }
}

/**
 * 停止开发服务器
 * 来源：Harness Engineering - tools.py stop_dev_server()
 */
async function stopDevServer(args) {
  // 检查是否有运行中的 dev server
  if (!devServerProc) {
    return 'No dev server running';
  }
  
  try {
    // 尝试优雅停止
    devServerProc.kill('SIGTERM');
    
    // 等待 5 秒后强制停止
    setTimeout(() => {
      if (devServerProc && devServerProc.pid) {
        try {
          process.kill(devServerProc.pid, 'SIGKILL');
        } catch (e) {
          // 进程可能已经停止
        }
      }
    }, 5000);
    
    devServerProc = null;
    return 'Dev server stopped';
  } catch (err) {
    return formatError(`stop_dev_server failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 网络搜索
// ---------------------------------------------------------------------------

/**
 * DuckDuckGo Lite 搜索
 */
async function webSearch(args) {
  const query = args.query;
  
  if (!query) {
    return formatError('web_search requires query');
  }
  
  // 使用 DuckDuckGo Lite
  try {
    const result = execSync(
      `curl -s "https://lite.duckduckgo.com/lite?q=${encodeURIComponent(query)}" | head -100`,
      { encoding: 'utf8', timeout: 15000 }
    );
    
    // 解析结果（简化版）
    const lines = result.split('\n').filter(l => l.includes('class="result"') || l.includes('<a'));
    return lines.slice(0, 10).join('\n') || '(no results)';
  } catch (err) {
    return formatError(`web_search failed: ${err.message}`);
  }
}

/**
 * 获取网页内容
 */
async function webFetch(args) {
  const url = args.url;
  
  if (!url) {
    return formatError('web_fetch requires url');
  }
  
  try {
    const result = execSync(
      `curl -sL -H "User-Agent: Mozilla/5.0" "${url}" | head -500`,
      { encoding: 'utf8', timeout: 30000 }
    );
    
    // 简化 HTML
    const text = result
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text.slice(0, 5000) || '(empty content)';
  } catch (err) {
    return formatError(`web_fetch failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 辅助工具
// ---------------------------------------------------------------------------

/**
 * 智能截断 - 保留错误行
 */
async function smartTruncate(args) {
  const text = args.text || args.content;
  const maxLength = args.max_length || args.maxLength || 5000;
  
  if (!text) {
    return formatError('smart_truncate requires text/content');
  }
  
  return smartTruncateResult(text, 'generic', maxLength);
}

/**
 * 自动验证和修正
 */
async function validateAndFix(args) {
  const toolName = args.tool_name;
  const toolArgs = args.tool_args;
  const result = args.result;
  
  // 检查常见错误
  const issues = [];
  const fixes = [];
  
  // JSON 解析错误
  if (result.includes('Invalid JSON')) {
    issues.push('JSON parse error');
    fixes.push('Ensure tool arguments are valid JSON');
  }
  
  // 文件不存在
  if (result.includes('File not found')) {
    issues.push('File not found');
    fixes.push('Check path exists with list_files first');
  }
  
  // 命令失败
  if (result.includes('Command failed')) {
    issues.push('Command execution failed');
    fixes.push('Check command syntax and permissions');
  }
  
  return {
    issues,
    fixes,
    autoFixed: issues.length === 0
  };
}

// ---------------------------------------------------------------------------
// 内部辅助函数
// ---------------------------------------------------------------------------

/**
 * 解析路径（确保在工作空间内）
 */
function resolvePath(relativePath) {
  // 绝对路径直接返回
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  
  // 相对路径解析到工作空间
  return path.resolve(WORKSPACE, relativePath);
}

/**
 * 验证参数
 */
function validateArgs(name, args) {
  const requiredParams = {
    read_file: ['path'],
    write_file: ['path', 'content'],
    edit_file: ['path', 'old_text'],
    run_bash: ['command'],
    delegate_task: ['task'],
    browser_test: ['url'],
    web_search: ['query'],
    web_fetch: ['url']
  };
  
  const required = requiredParams[name];
  if (!required) return { valid: true };
  
  for (const param of required) {
    if (!args[param]) {
      return { valid: false, error: `Missing required parameter: ${param}` };
    }
  }
  
  return { valid: true };
}

/**
 * 自动修正参数
 * 来源：Harness Engineering - tools.py _validate_and_fix()
 * 
 * 自动修正常见错误:
 * - 绝对路径 → 相对路径
 * - 空/缺失参数
 * - 交互式命令警告
 */
function autoFixArgs(name, args) {
  let warning = null;
  
  // 统一参数名
  if (args.oldText && !args.old_text) args.old_text = args.oldText;
  if (args.newText && !args.new_text) args.new_text = args.newText;
  if (args.cwd && !args.workdir) args.workdir = args.cwd;
  if (args.agentId && !args.agent_id) args.agent_id = args.agentId;
  if (args.maxLength && !args.max_length) args.max_length = args.maxLength;
  if (args.startCommand && !args.start_command) args.start_command = args.startCommand;
  if (args.startupWait && !args.startup_wait) args.startup_wait = args.startupWait;
  
  // write_file 修正
  if (name === 'write_file') {
    const filePath = args.path || '';
    const content = args.content;
    
    // 空路径
    if (!filePath || !filePath.trim()) {
      return { ...args, _warning: '[auto-fix] Empty file path. You must specify a path.' }; 
    }
    
    // 绝对路径 → 相对路径
    if (filePath.startsWith('/')) {
      const prefixes = ['/app/', '/home/user/', '/workspace/', '/Users/mac/.openclaw/workspace/'];
      for (const prefix of prefixes) {
        if (filePath.startsWith(prefix)) {
          args.path = filePath.slice(prefix.length);
          warning = `[auto-fix] Converted absolute path '${filePath}' to relative '${args.path}'`; 
          break;
        }
      }
    }
    
    // 缺失 content
    if (content === undefined) {
      args.content = ''; 
      warning = '[auto-fix] Missing content argument — writing empty file.'; 
    }
  }
  
  // read_file 修正
  if (name === 'read_file') {
    const filePath = args.path || ''; 
    
    // 绝对路径 → 相对路径
    if (filePath.startsWith('/')) {
      const prefixes = ['/app/', '/home/user/', '/workspace/', '/Users/mac/.openclaw/workspace/'];
      for (const prefix of prefixes) {
        if (filePath.startsWith(prefix)) {
          args.path = filePath.slice(prefix.length); 
          warning = `[auto-fix] Converted absolute path '${filePath}' to relative '${args.path}'`; 
          break;
        }
      }
    }
  }
  
  // run_bash 修正
  if (name === 'run_bash') {
    const command = args.command || ''; 
    
    // 空命令
    if (!command || !command.trim()) {
      return { ...args, _warning: '[auto-fix] Empty command. You must specify a command to run.' }; 
    }
    
    // 交互式命令警告
    const interactiveCmds = ['vim', 'nano', 'vi', 'less', 'more', 'top', 'htop'];
    const firstWord = command.trim().split(' ')[0];
    if (interactiveCmds.includes(firstWord)) {
      return { 
        ...args, 
        _warning: `[auto-fix] '${firstWord}' is an interactive command that will hang. Use non-interactive alternatives: for editing use write_file, for viewing use cat/head/tail.`
      }; 
    }
  }
  
  // list_files 修正
  if (name === 'list_files') {
    const directory = args.directory || args.path || '.'; 
    
    // 绝对路径 → 相对路径
    if (directory.startsWith('/')) {
      const prefixes = ['/app/', '/home/user/', '/workspace/', '/Users/mac/.openclaw/workspace/'];
      for (const prefix of prefixes) {
        if (directory.startsWith(prefix)) {
          args.directory = directory.slice(prefix.length) || '.'; 
          warning = `[auto-fix] Converted absolute path '${directory}' to relative '${args.directory}'`; 
          break;
        }
      }
    }
  }
  
  // 添加警告
  if (warning) {
    args._warning = warning; 
  }
  
  return args;
}

/**
 * 格式化错误消息
 */
function formatError(message) {
  return `[error] ${message}`;
}

/**
 * 智能截断结果 - 提取中间错误行
 * 来源：Harness Engineering - tools.py _smart_truncate_output()
 * 
 * 策略：
 * - Head 40% + Tail 40% + Important Middle 20%
 * - 从中间部分提取包含 error/warning/fail 关键词的行
 */
function smartTruncateResult(result, toolName, maxLength = 8000) {
  if (!result || result.length <= maxLength) {
    return result;
  }
  
  // 错误消息全文保留
  if (result.startsWith('[error]')) {
    return result;
  }
  
  // 对于 run_bash 结果，使用智能截断
  if (toolName === 'run_bash' || toolName === 'generic') {
    return smartTruncateOutput(result, '', maxLength);
  }
  
  // 其他工具：简单首尾截断
  const headSize = Math.floor(maxLength * 0.7);
  const tailSize = Math.floor(maxLength * 0.3);
  
  const head = result.slice(0, headSize);
  const tail = result.slice(-tailSize);
  const truncated = result.length - headSize - tailSize;
  
  return `${head}\n\n... [truncated ${truncated} chars] ...\n\n${tail}`;
}

/**
 * 智能截断输出 - 提取中间重要行
 * 来源：Harness Engineering - tools.py _smart_truncate_output()
 */
function smartTruncateOutput(stdout, stderr, limit = 30000) {
  const combined = (stdout + '\n' + stderr).trim();
  
  if (combined.length <= limit) {
    return combined;
  }
  
  // stderr 预算：40%
  const stderrBudget = Math.min(stderr.length, Math.floor(limit * 0.4));
  const stdoutBudget = limit - stderrBudget;
  
  // 截断 stderr（保留尾部，最新错误最重要）
  let truncatedStderr = stderr;
  if (stderr.length > stderrBudget) {
    truncatedStderr = '...[stderr truncated]\n' + stderr.slice(-(stderrBudget - 30));
  }
  
  // 智能截断 stdout
  let truncatedStdout;
  if (stdout.length <= stdoutBudget) {
    truncatedStdout = stdout;
  } else {
    // Head 40%, Tail 40%, Middle 20% 用于重要行
    const headSize = Math.floor(stdoutBudget * 0.40);
    const tailSize = Math.floor(stdoutBudget * 0.40);
    const middleBudget = stdoutBudget - headSize - tailSize - 200;
    
    const head = stdout.slice(0, headSize);
    const tail = stdout.slice(-tailSize);
    const middle = stdout.slice(headSize, -tailSize);
    
    // 提取中间重要行（包含 error/warning/fail 等关键词）
    const errorPattern = /error|fail|assert|exception|traceback|warning|not found|denied|refused|fatal/i;
    const importantLines = [];
    
    if (middle && middleBudget > 0) {
      for (const line of middle.split('\n')) {
        if (errorPattern.test(line)) {
          importantLines.push(line);
        }
      }
    }
    
    let importantSection = importantLines.join('\n');
    if (importantSection.length > middleBudget) {
      importantSection = importantSection.slice(0, middleBudget);
    }
    
    // 组合
    let middlePart;
    if (importantSection) {
      middlePart = `\n\n[...${middle.length} chars omitted — key lines extracted:]\n${importantSection}\n[...end extracted lines]\n\n`; 
    } else {
      middlePart = `\n\n[TRUNCATED — ${middle.length} chars omitted from middle]\n\n`; 
    }
    
    truncatedStdout = head + middlePart + tail;
  }
  
  // 合并
  if (truncatedStderr) {
    return truncatedStdout + '\n\n--- STDERR ---\n' + truncatedStderr;
  }
  return truncatedStdout;
}

/**
 * 大结果持久化
 * 来源：Harness Engineering - tools.py execute_tool()
 * Claude Code pattern: >50KB 结果写入文件
 */
function persistLargeResult(result, toolName) {
  if (typeof result !== 'string' || result.length <= 50000) {
    return result;  // 不需要持久化
  }
  
  // 持久化到文件
  const persistedPath = path.join(WORKSPACE, `_tool_output_${toolName}.txt`);
  
  try {
    fs.writeFileSync(persistedPath, result, 'utf8');
    
    // 返回预览
    const preview = result.slice(0, 2000);
    return (
      `Output too large (${result.length} chars). Full output saved to: ` +
      `_tool_output_${toolName}.txt\n\n` +
      `Preview (first 2000 chars):\n${preview}\n...\n` +
      `Use read_file or run_bash with cat/tail to read specific parts.`
    );
  } catch (err) {
    // 持久化失败，使用截断
    return result.slice(0, 30000) + `\n\n[TRUNCATED — ${result.length} total chars]`; 
  }
}

/**
 * 记录工具调用日志
 */
function logToolCall(name, args, result, elapsed) {
  const logPath = path.join(WORKSPACE, 'memory', 'tool-calls.log');
  
  try {
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const entry = {
      timestamp: new Date().toISOString(),
      tool: name,
      args: JSON.stringify(args).slice(0, 200),
      resultLength: result.length,
      elapsed,
      success: !result.startsWith('[error]')
    };
    
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    // 忽略日志错误
  }
}

// ---------------------------------------------------------------------------
// OpenAI Function Calling Schema
// ---------------------------------------------------------------------------

/**
 * 基础工具 Schema（所有 Agent 可用）
 * 来源：Harness Engineering - tools.py TOOL_SCHEMAS
 */
const TOOL_SCHEMAS = [
  // 文件操作
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a file from the workspace.',
      parameters: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string', description: 'Relative path inside workspace' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_skill_file',
      description: 'Read a skill guide from the skills/ directory (e.g. skills/frontend-design/SKILL.md).',
      parameters: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string', description: 'Relative path to skill file from project root' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Create or overwrite a file in the workspace.',
      parameters: {
        type: 'object',
        required: ['path', 'content'],
        properties: {
          path: { type: 'string', description: 'Relative path inside workspace' },
          content: { type: 'string', description: 'File content to write' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: 'Replace an exact string in a file. For modifying existing files.',
      parameters: {
        type: 'object',
        required: ['path', 'old_text'],
        properties: {
          path: { type: 'string', description: 'Relative path inside workspace' },
          old_text: { type: 'string', description: 'Exact text to replace (must be unique)' },
          new_text: { type: 'string', description: 'Replacement text' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List all files in a directory recursively.',
      parameters: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Relative directory path (default: root)', default: '.' }
        }
      }
    }
  },
  // Shell 命令
  {
    type: 'function',
    function: {
      name: 'run_bash',
      description: 'Execute a shell command in the workspace directory.',
      parameters: {
        type: 'object',
        required: ['command'],
        properties: {
          command: { type: 'string', description: 'Shell command to run' },
          timeout: { type: 'integer', description: 'Timeout in seconds (default 300)', default: 300 }
        }
      }
    }
  },
  // 子代理
  {
    type: 'function',
    function: {
      name: 'delegate_task',
      description: 'Spawn a sub-agent in an isolated context to handle a subtask.',
      parameters: {
        type: 'object',
        required: ['task'],
        properties: {
          task: { type: 'string', description: 'Detailed description of the subtask' },
          role: { type: 'string', description: 'Role hint (e.g. codebase_explorer)', default: 'assistant' }
        }
      }
    }
  },
  // 网络搜索
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web. Returns titles, URLs, and snippets.',
      parameters: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', description: 'Search query' },
          max_results: { type: 'integer', description: 'Max results (default 5)', default: 5 }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_fetch',
      description: 'Fetch a web page as text. Use after web_search.',
      parameters: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', description: 'URL to fetch' }
        }
      }
    }
  }
];

/**
 * 浏览器测试工具 Schema（Evaluator 专用）
 * 来源：Harness Engineering - tools.py BROWSER_TOOL_SCHEMAS
 */
const BROWSER_TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'browser_test',
      description: 'Launch a headless Chromium browser to test the running application. Navigates to a URL, performs UI actions, captures console errors, and takes a screenshot.',
      parameters: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', description: 'URL to navigate to (e.g. http://localhost:5173)' },
          actions: {
            type: 'array',
            description: 'List of browser actions to perform',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['click', 'fill', 'wait', 'evaluate', 'scroll'], description: 'Action type' },
                selector: { type: 'string', description: 'CSS selector (for click/fill)' },
                value: { type: 'string', description: 'Text for fill, JS code for evaluate, pixels for scroll' },
                delay: { type: 'integer', description: 'Milliseconds to wait (for wait action)' }
              }
            }
          },
          screenshot: { type: 'boolean', description: 'Take a screenshot after actions (default: true)', default: true },
          start_command: { type: 'string', description: 'Shell command to start the dev server (e.g. npm run dev)' },
          port: { type: 'integer', description: 'Port the dev server runs on (default: 5173)', default: 5173 },
          startup_wait: { type: 'integer', description: 'Seconds to wait for dev server to start (default: 8)', default: 8 }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'stop_dev_server',
      description: 'Stop the background dev server started by browser_test.',
      parameters: { type: 'object', properties: {} }
    }
  }
];

// ---------------------------------------------------------------------------
// CLI 入口
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
Tools Executor - 统一工具执行器

用法:
  node tools-executor.js execute <name> <args_json>
  node tools-executor.js list
  node tools-executor.js test

可用工具:
  read_file        读取文件
  read_skill_file  读取 Skill 文件
  write_file       写入文件
  edit_file        编辑文件（精确替换）
  list_files       列出文件
  run_bash         执行Shell命令
  delegate_task    派发子代理
  browser_test     浏览器测试
  stop_dev_server  停止开发服务器
  web_search       网络搜索
  web_fetch        获取网页
  smart_truncate   智能截断
  validate_and_fix 验证修正

示例:
  node tools-executor.js execute read_file '{"path":"test.txt"}'
  node tools-executor.js execute run_bash '{"command":"ls -la"}'
`);
    process.exit(0);
  }
  
  if (command === 'list') {
    console.log('可用工具:');
    for (const [name, tool] of Object.entries(TOOLS_REGISTRY)) {
      console.log(`  ${name} (timeout: ${tool.timeout}ms)`);
    }
    process.exit(0);
  }
  
  if (command === 'test') {
    console.log('\n🧪 测试 Tools Executor:\n');
    
    // 测试路径解析
    const resolved = resolvePath('test.txt');
    console.log(`  路径解析: ${resolved} ✓`);
    
    // 测试参数验证
    const valid1 = validateArgs('read_file', { path: 'test.txt' });
    console.log(`  参数验证(有path): ${valid1.valid ? '✅' : '❌'}`);
    
    const valid2 = validateArgs('read_file', {});
    console.log(`  参数验证(无path): ${!valid2.valid ? '✅' : '❌'}`);
    
    // 测试智能截断
    const longText = 'x'.repeat(10000);
    const truncated = smartTruncateResult(longText, 'test', 100);
    // 截断后应该包含...和首尾内容
    const hasTruncationMarker = truncated.includes('[truncated');
    console.log(`  智能截断: ${hasTruncationMarker ? '✅' : '❌'}`);
    
    // 测试错误格式
    const error = formatError('test error');
    console.log(`  错误格式: ${error.startsWith('[error]') ? '✅' : '❌'}`);
    
    console.log('\n✅ Tests passed');
    process.exit(0);
  }
  
  if (command === 'execute') {
    const name = args[1];
    const argsJson = args[2];
    
    if (!name || !argsJson) {
      console.error('用法: node tools-executor.js execute <name> <args_json>');
      process.exit(1);
    }
    
    try {
      const toolArgs = JSON.parse(argsJson);
      const result = await executeTool(name, toolArgs);
      console.log(result);
    } catch (err) {
      console.error(`执行失败: ${err.message}`);
      process.exit(1);
    }
    
    process.exit(0);
  }
  
  console.error(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// 导出
module.exports = {
  executeTool,
  TOOLS_REGISTRY,
  TOOL_SCHEMAS,         // OpenAI function-calling schemas
  BROWSER_TOOL_SCHEMAS, // Evaluator-only schemas
  resolvePath,
  validateArgs,
  autoFixArgs,
  formatError,
  smartTruncateResult,
  smartTruncateOutput,
  persistLargeResult,
  logToolCall,
  // 工具函数
  readFile,
  readSkillFile,
  writeFile,
  editFile,
  listFiles,
  runBash,
  delegateTask,
  browserTest,
  stopDevServer,
  webSearch,
  webFetch,
  smartTruncate,
  validateAndFix
};

// CLI 入口
if (require.main === module) {
  main();
}