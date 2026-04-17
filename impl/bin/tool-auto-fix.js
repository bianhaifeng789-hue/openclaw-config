#!/usr/bin/env node
/**
 * Tool Auto-Fix - 工具调用预验证和自动修正
 * 
 * 来源：Harness Engineering - tools.py _validate_and_fix()
 * 
 * 功能：
 * - 空路径检测 → 阻止执行
 * - 绝对路径转换 → /app/xxx → xxx
 * - 交互命令检测 → vim/nano → 建议 cat/head/tail
 * - 空命令检测 → 阻止执行
 * 
 * 用法：
 * node tool-auto-fix.js validate <tool_name> <arguments_json>
 * node tool-auto-fix.js status
 */

const fs = require('fs');
const path = require('path');

// 常见工作区前缀
const WORKSPACE_PREFIXES = ['/app/', '/home/user/', '/workspace/'];

// 交互式命令（会挂起）
const INTERACTIVE_COMMANDS = ['vim', 'nano', 'vi', 'less', 'more', 'top', 'htop', 'emacs'];

/**
 * 验证和修正工具参数
 * @param {string} toolName - 工具名称
 * @param {Object} arguments - 工具参数
 * @returns {Object} {fixedArguments, warning}
 */
function validateAndFix(toolName, args) {
  let warning = null;
  const fixedArgs = {...args};
  
  switch (toolName) {
    case 'write_file':
    case 'write':
    case 'edit':
      const filePath = args.path || args.file_path || '';
      
      // 空路径检测
      if (!filePath || !filePath.trim()) {
        return {
          fixedArgs,
          warning: '[auto-fix] Empty file path. You must specify a path.',
          blocked: true
        };
      }
      
      // 绝对路径转换
      if (filePath.startsWith('/')) {
        for (const prefix of WORKSPACE_PREFIXES) {
          if (filePath.startsWith(prefix)) {
            fixedArgs.path = filePath.slice(prefix.length);
            fixedArgs.file_path = fixedArgs.path;
            warning = `[auto-fix] Converted absolute path '${filePath}' to relative '${fixedArgs.path}'`;
            break;
          }
        }
      }
      
      // 缺少content
      if (args.content === undefined && args.contents === undefined) {
        fixedArgs.content = '';
        warning = '[auto-fix] Missing \'content\' argument — writing empty file.';
      }
      break;
      
    case 'read_file':
    case 'read':
      const readPath = args.path || args.file_path || '';
      
      // 绝对路径转换
      if (readPath.startsWith('/')) {
        for (const prefix of WORKSPACE_PREFIXES) {
          if (readPath.startsWith(prefix)) {
            fixedArgs.path = readPath.slice(prefix.length);
            fixedArgs.file_path = fixedArgs.path;
            warning = `[auto-fix] Converted absolute path '${readPath}' to relative '${fixedArgs.path}'`;
            break;
          }
        }
      }
      break;
      
    case 'run_bash':
    case 'exec':
    case 'execute':
      const command = args.command || args.cmd || '';
      
      // 空命令检测
      if (!command || !command.trim()) {
        return {
          fixedArgs,
          warning: '[auto-fix] Empty command. You must specify a command to run.',
          blocked: true
        };
      }
      
      // 交互命令检测
      const firstWord = command.trim().split(' ')[0];
      if (INTERACTIVE_COMMANDS.includes(firstWord)) {
        return {
          fixedArgs,
          warning: `[auto-fix] '${firstWord}' is an interactive command that will hang. Use non-interactive alternatives: for editing use write_file, for viewing use cat/head/tail.`,
          blocked: true
        };
      }
      break;
      
    case 'list_files':
    case 'ls':
      const directory = args.directory || args.dir || '.';
      
      // 绝对路径转换
      if (directory.startsWith('/')) {
        for (const prefix of WORKSPACE_PREFIXES) {
          if (directory.startsWith(prefix)) {
            fixedArgs.directory = directory.slice(prefix.length) || '.';
            fixedArgs.dir = fixedArgs.directory;
            warning = `[auto-fix] Converted absolute path '${directory}' to relative '${fixedArgs.directory}'`;
            break;
          }
        }
      }
      break;
  }
  
  return {
    fixedArgs,
    warning,
    blocked: false
  };
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'validate') {
    const toolName = args[1];
    const argsJson = args[2];
    
    if (!toolName || !argsJson) {
      console.error('用法: node tool-auto-fix.js validate <tool_name> <arguments_json>');
      process.exit(1);
    }
    
    try {
      const toolArgs = JSON.parse(argsJson);
      const result = validateAndFix(toolName, toolArgs);
      
      console.log(JSON.stringify(result, null, 2));
      
      if (result.blocked) {
        console.log('\n⚠️ 阻止执行：', result.warning);
      } else if (result.warning) {
        console.log('\n⚠️ 自动修正：', result.warning);
      } else {
        console.log('\n✅ 参数有效，无需修正');
      }
    } catch (err) {
      console.error('解析失败:', err.message);
      process.exit(1);
    }
  } else if (command === 'status') {
    console.log(JSON.stringify({
      interactiveCommands: INTERACTIVE_COMMANDS,
      workspacePrefixes: WORKSPACE_PREFIXES,
      version: '1.0.0'
    }, null, 2));
  } else if (command === 'test') {
    // 测试模式
    const testCases = [
      {tool: 'write_file', args: {path: '/app/test.py', content: 'hello'}},
      {tool: 'write_file', args: {path: ''}},
      {tool: 'run_bash', args: {command: 'vim test.txt'}},
      {tool: 'run_bash', args: {command: ''}}
    ];
    
    console.log('测试结果:');
    for (const tc of testCases) {
      const result = validateAndFix(tc.tool, tc.args);
      console.log(`\n${tc.tool}: ${JSON.stringify(tc.args)}`);
      console.log(`  结果: ${result.blocked ? '❌阻止' : (result.warning ? '⚠️修正' : '✅通过')}`);
      if (result.warning) console.log(`  警告: ${result.warning}`);
      if (!result.blocked && result.fixedArgs.path !== tc.args.path) {
        console.log(`  修正: path='${tc.args.path}' → '${result.fixedArgs.path}'`);
      }
    }
  } else {
    console.log(`
Tool Auto-Fix - 工具调用预验证和自动修正

用法:
  node tool-auto-fix.js validate <tool_name> <arguments_json>  验证工具参数
  node tool-auto-fix.js status                                  查看状态
  node tool-auto-fix.js test                                    运行测试

功能:
  - 空路径检测 → 阻止执行
  - 绝对路径转换 → /app/xxx → xxx
  - 交互命令检测 → vim/nano → 建议 cat/head/tail
  - 空命令检测 → 阻止执行

来源: Harness Engineering - tools.py _validate_and_fix()
`);
  }
}

// 导出函数
module.exports = {
  validateAndFix,
  INTERACTIVE_COMMANDS,
  WORKSPACE_PREFIXES
};

// CLI入口
if (require.main === module) {
  main();
}