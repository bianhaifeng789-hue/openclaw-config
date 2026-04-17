#!/usr/bin/env node
/**
 * Tools Executor - 工具执行器
 *
 * 来源：Harness Engineering - tools.py
 *
 * 工具列表：
 * - read_file: 读取文件
 * - read_skill_file: 读取 skill 文件（Skill 渐进式披露 Level 2）
 * - write_file: 写入文件
 * - edit_file: 编辑文件
 * - list_files: 列出文件
 * - run_bash: 执行 shell 命令
 * - delegate_task: 委派任务给 sub-agent（上下文隔离）
 * - web_search: 搜索网页
 * - web_fetch: 抓取网页
 *
 * 用法：
 *   node tools-executor.js execute <fn_name> <fn_args_json>
 *   node tools-executor.js schemas
 *   node tools-executor.js list
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOME = process.env.HOME || '/Users/mar2game';
const WORKSPACE = process.env.HARNESS_WORKSPACE || `${HOME}/.openclaw/workspace/harness-projects`;
const PROJECT_ROOT = `${HOME}/.openclaw/workspace`;

/**
 * 工具实现
 */
const tools = {
  /**
   * read_file - 读取文件
   */
  read_file: (args) => {
    const { path: filePath } = args;
    const resolved = _resolve(filePath);
    
    if (!fs.existsSync(resolved)) {
      return `[error] File not found: ${filePath}`;
    }
    
    const content = fs.readFileSync(resolved, 'utf8');
    const limit = 60000;
    
    if (content.length > limit) {
      return content.slice(0, limit) + `\n\n[TRUNCATED] You are seeing ${limit} of ${content.length} total characters. The remaining ${content.length - limit} characters are NOT shown above. You MUST use run_bash with head/tail/sed to read the rest if needed.`;
    }
    
    return content;
  },

  /**
   * read_skill_file - 读取 skill 文件（Skill 渐进式披露 Level 2）
   */
  read_skill_file: (args) => {
    const { path: skillPath } = args;
    const resolved = path.join(PROJECT_ROOT, 'skills', skillPath);
    const skillsDir = path.join(PROJECT_ROOT, 'skills');
    
    // 检查路径是否在 skills 目录内
    if (!resolved.startsWith(skillsDir)) {
      return `[error] Path must be inside skills/ directory: ${skillPath}`;
    }
    
    if (!fs.existsSync(resolved)) {
      return `[error] Skill file not found: ${skillPath}`;
    }
    
    const content = fs.readFileSync(resolved, 'utf8');
    return content.slice(0, 60000);
  },

  /**
   * write_file - 写入文件
   */
  write_file: (args) => {
    const { path: filePath, content } = args;
    
    if (!filePath || !filePath.trim()) {
      return '[error] Empty file path';
    }
    
    const resolved = _resolve(filePath);
    const dir = path.dirname(resolved);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(resolved, content, 'utf8');
    return `Wrote ${content.length} chars to ${filePath}`;
  },

  /**
   * edit_file - 编辑文件（精确替换）
   */
  edit_file: (args) => {
    const { path: filePath, old_string, new_string } = args;
    const resolved = _resolve(filePath);
    
    if (!fs.existsSync(resolved)) {
      if (old_string === '') {
        // 创建新文件
        const dir = path.dirname(resolved);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(resolved, new_string, 'utf8');
        return `Created new file ${filePath} (${new_string.length} chars)`;
      }
      return `[error] File not found: ${filePath}`;
    }
    
    const content = fs.readFileSync(resolved, 'utf8');
    
    if (!content.includes(old_string)) {
      // 尝试找到接近的匹配并报告
      const linesWithMatch = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(old_string.slice(0, 40)) || 
            (old_string.length > 10 && lines[i].includes(old_string.slice(0, 20)))) {
          linesWithMatch.push(`  line ${i + 1}: ${lines[i].trim().slice(0, 100)}`);
        }
      }
      
      const hint = linesWithMatch.length > 0 ? 
        '\nPartial matches found:\n' + linesWithMatch.slice(0, 3).join('\n') : '';
      
      return `[error] old_string not found in ${filePath}. Make sure it matches EXACTLY (including whitespace/indentation).${hint}`;
    }
    
    const count = content.split(old_string).length - 1;
    if (count > 1) {
      return `[error] old_string appears ${count} times in ${filePath}. Provide more surrounding context to make it unique, or use write_file to replace the entire file.`;
    }
    
    const newContent = content.replace(old_string, new_string);
    fs.writeFileSync(resolved, newContent, 'utf8');
    return `Edited ${filePath}: replaced ${old_string.length} chars with ${new_string.length} chars`;
  },

  /**
   * list_files - 列出文件
   */
  list_files: (args) => {
    const { directory = '.' } = args;
    const resolved = _resolve(directory);
    
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      return `[error] Not a directory: ${directory}`;
    }
    
    const entries = [];
    const files = _walkDir(resolved);
    
    for (const file of files) {
      const rel = path.relative(WORKSPACE, file);
      entries.push(rel);
    }
    
    if (entries.length === 0) {
      return '(empty)';
    }
    
    return entries.slice(0, 200).join('\n');
  },

  /**
   * run_bash - 执行 shell 命令
   */
  run_bash: (args) => {
    const { command, timeout = 300 } = args;
    
    try {
      const result = execSync(command, {
        cwd: WORKSPACE,
        encoding: 'utf8',
        timeout: timeout * 1000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const output = _smartTruncate(result.stdout || '', result.stderr || '');
      
      // 非零退出码时添加提示
      // 注意：execSync 在非零退出码时会抛出异常，所以这里不会执行
      return output || '(no output)';
      
    } catch (err) {
      // 处理 timeout 和非零退出码
      if (err.killed) {
        return `[error] Command timed out after ${timeout}s. If this command legitimately needs more time (e.g. compilation, training), retry with a larger timeout parameter.`;
      }
      
      const stdout = err.stdout || '';
      const stderr = err.stderr || '';
      const output = _smartTruncate(stdout, stderr);
      const exitCode = err.status || 1;
      
      return `[exit code: ${exitCode}]\n${output}`;
    }
  },

  /**
   * delegate_task - 委派任务给 sub-agent（上下文隔离）
   */
  delegate_task: async (args) => {
    const { task, role = 'assistant' } = args;
    
    // 创建 sub-agent（全新上下文）
    // 这里需要外部注入 Agent 类
    // 简化版本：返回提示信息
    return `[delegate_task placeholder] Task: ${task.slice(0, 100)}... Role: ${role}. To implement: spawn Agent with clean context and return result[:8000].`;
  },

  /**
   * web_search - 搜索网页（需要外部注入）
   */
  web_search: (args) => {
    const { query, max_results = 5 } = args;
    return `[web_search placeholder] Query: ${query}. Max results: ${max_results}. To implement: integrate with search API.`;
  },

  /**
   * web_fetch - 抓取网页（需要外部注入）
   */
  web_fetch: (args) => {
    const { url } = args;
    return `[web_fetch placeholder] URL: ${url}. To implement: use fetch API to get content.`;
  }
};

/**
 * 工具 schemas（OpenAI function-calling format）
 */
const TOOL_SCHEMAS = [
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
      description: 'Read a skill guide from the skills/ directory (e.g. \'skills/frontend-design/SKILL.md\').',
      parameters: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string', description: 'Relative path to skill file from skills/ directory' }
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
        required: ['path', 'old_string', 'new_string'],
        properties: {
          path: { type: 'string', description: 'Relative path inside workspace' },
          old_string: { type: 'string', description: 'Exact string to replace' },
          new_string: { type: 'string', description: 'New string to insert' }
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
  {
    type: 'function',
    function: {
      name: 'delegate_task',
      description: 'Spawn a sub-agent in an isolated context to handle a subtask. Returns only its summary.',
      parameters: {
        type: 'object',
        required: ['task'],
        properties: {
          task: { type: 'string', description: 'Detailed description of the subtask to delegate' },
          role: { type: 'string', description: 'Role hint (e.g. \'codebase_explorer\', \'test_runner\')', default: 'assistant' }
        }
      }
    }
  },
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

// --- 内部函数 ---

/**
 * 解析路径（防止路径逃逸）
 */
function _resolve(filePath) {
  const resolved = path.resolve(WORKSPACE, filePath);
  
  if (!resolved.startsWith(WORKSPACE)) {
    throw new Error(`Path escapes workspace: ${filePath}`);
  }
  
  return resolved;
}

/**
 * 遍历目录
 */
function _walkDir(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * 智能截断输出（保留 stderr 和关键信息）
 */
function _smartTruncate(stdout, stderr, limit = 30000) {
  // 总是保留 stderr（最多占一半）
  const stderrBudget = Math.floor(limit / 2);
  const stderrLimited = stderr.length > stderrBudget ? 
    stderr.slice(0, stderrBudget) + '\n[stderr truncated]' : stderr;
  
  // 提取 stdout 中的错误/警告关键词行
  const keywords = ['error', 'warning', 'failed', 'exception', 'traceback'];
  const lines = stdout.split('\n');
  const importantLines = [];
  
  for (const line of lines) {
    if (keywords.some(k => line.toLowerCase().includes(k))) {
      importantLines.push(line);
    }
  }
  
  // 保留开头 + 结尾 + 重要行
  const stdoutBudget = limit - stderrLimited.length;
  const headLines = lines.slice(0, 20).join('\n');
  const tailLines = lines.slice(-20).join('\n');
  const importantText = importantLines.slice(0, 10).join('\n');
  
  let stdoutResult = headLines;
  if (importantText) {
    stdoutResult += '\n\n=== Important lines ===\n' + importantText;
  }
  stdoutResult += '\n\n=== Last 20 lines ===\n' + tailLines;
  
  if (stdoutResult.length > stdoutBudget) {
    stdoutResult = stdoutResult.slice(0, stdoutBudget) + '\n[stdout truncated]';
  }
  
  if (stderrLimited) {
    return stdoutResult + '\n\n=== stderr ===\n' + stderrLimited;
  }
  
  return stdoutResult;
}

/**
 * 执行工具
 */
function executeTool(fnName, fnArgs) {
  if (!tools[fnName]) {
    return `[error] Unknown tool: ${fnName}`;
  }
  
  try {
    return tools[fnName](fnArgs);
  } catch (err) {
    return `[error] Tool execution failed: ${err.message}`;
  }
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'execute') {
    const fnName = args[1];
    const fnArgsJson = args[2];
    
    try {
      const fnArgs = JSON.parse(fnArgsJson);
      const result = executeTool(fnName, fnArgs);
      console.log(result);
    } catch (err) {
      console.log(`[error] Invalid arguments: ${err.message}`);
    }
    
  } else if (command === 'schemas') {
    console.log(JSON.stringify(TOOL_SCHEMAS, null, 2));
    
  } else if (command === 'list') {
    console.log('Available tools:');
    for (const schema of TOOL_SCHEMAS) {
      console.log(`- ${schema.function.name}: ${schema.function.description.slice(0, 60)}...`);
    }
    
  } else {
    console.log('Usage:');
    console.log('  node tools-executor.js execute <fn_name> <fn_args_json>');
    console.log('  node tools-executor.js schemas');
    console.log('  node tools-executor.js list');
  }
}

// Export
module.exports = { tools, TOOL_SCHEMAS, executeTool };

// Run CLI
if (require.main === module) {
  main();
}