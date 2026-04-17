#!/usr/bin/env node
/**
 * Task Tracking - 任务追踪强制_todo.md
 * 
 * 强制Agent创建并维护任务追踪文件
 * 
 * 来源：Harness Engineering - TaskTrackingMiddleware
 * 
 * 触发条件：
 * - 第4次工具调用后强制创建 _todo.md
 * - 每12次工具调用检查更新
 * - 内容hash变化检测
 * 
 * 用法：
 * node task-tracking.js check <workspace> <tool_call_count>
 * node task-tracking.js create <workspace>
 * node task-tracking.js update <workspace>
 */

const fs = require('fs');
const path = require('path');

// 首次创建阈值
const CREATE_THRESHOLD = 4;
// 检查更新阈值
const UPDATE_THRESHOLD = 12;
// Todo文件名
const TODO_FILE = '_todo.md';

/**
 * 检查任务追踪状态
 * @param {string} workspace - 工作目录
 * @param {number} toolCallCount - 工具调用次数
 * @returns {Object} 检查结果
 */
function checkTaskTracking(workspace, toolCallCount) {
  const todoPath = path.join(workspace, TODO_FILE);
  const todoExists = fs.existsSync(todoPath);
  
  // 首次创建检查
  if (!todoExists && toolCallCount >= CREATE_THRESHOLD) {
    return {
      action: 'create',
      reason: `第${toolCallCount}次工具调用后未创建${TODO_FILE}`,
      mandatory: true,
      message: getCreateMessage()
    };
  }
  
  // 更新检查
  if (todoExists && toolCallCount % UPDATE_THRESHOLD === 0) {
    const content = fs.readFileSync(todoPath, 'utf8');
    const hash = getContentHash(content);
    
    return {
      action: 'update',
      reason: `${UPDATE_THRESHOLD}次工具调用周期检查`,
      mandatory: false,
      currentHash: hash,
      message: getUpdateMessage()
    };
  }
  
  // 正常状态
  if (todoExists) {
    return {
      action: 'none',
      reason: `${TODO_FILE}已存在`,
      mandatory: false
    };
  }
  
  return {
    action: 'wait',
    reason: `等待第${CREATE_THRESHOLD}次工具调用`,
    mandatory: false,
    remaining: CREATE_THRESHOLD - toolCallCount
  };
}

/**
 * 创建Todo文件
 * @param {string} workspace - 工作目录
 * @param {string} task - 任务描述
 * @returns {Object} 创建结果
 */
function createTodo(workspace, task) {
  const todoPath = path.join(workspace, TODO_FILE);
  
  const template = `# Task Tracking

## Current Task
${task || '[从原始任务中提取]'}

## Checklist
- [ ] Step 1: [待填写]
- [ ] Step 2: [待填写]
- [ ] Step 3: [待填写]

## Progress
- Started: ${new Date().toISOString()}
- Tool calls: 0
- Files modified: 0

## Notes
- [记录重要决策和发现]

---
自动生成时间: ${new Date().toISOString()}
`;

  fs.writeFileSync(todoPath, template, 'utf8');
  
  return {
    created: true,
    path: todoPath,
    template,
    hash: getContentHash(template)
  };
}

/**
 * 更新Todo文件
 * @param {string} workspace - 工作目录
 * @param {Object} updates - 更新内容
 * @returns {Object} 更新结果
 */
function updateTodo(workspace, updates) {
  const todoPath = path.join(workspace, TODO_FILE);
  
  if (!fs.existsSync(todoPath)) {
    return {
      updated: false,
      error: `${TODO_FILE}不存在`
    };
  }
  
  const currentContent = fs.readFileSync(todoPath, 'utf8');
  let updatedContent = currentContent;
  
  // 更新进度
  if (updates.toolCalls) {
    updatedContent = updatedContent.replace(
      /Tool calls: \d+/,
      `Tool calls: ${updates.toolCalls}`
    );
  }
  
  if (updates.filesModified) {
    updatedContent = updatedContent.replace(
      /Files modified: \d+/,
      `Files modified: ${updates.filesModified}`
    );
  }
  
  // 添加进度项
  if (updates.progress) {
    const progressSection = extractSection(updatedContent, '## Progress');
    updatedContent = updatedContent.replace(
      progressSection,
      `${progressSection}\n- ${updates.progress} (${new Date().toISOString()})`
    );
  }
  
  fs.writeFileSync(todoPath, updatedContent, 'utf8');
  
  return {
    updated: true,
    path: todoPath,
    previousHash: getContentHash(currentContent),
    currentHash: getContentHash(updatedContent),
    changed: getContentHash(currentContent) !== getContentHash(updatedContent)
  };
}

/**
 * 提取Markdown区块
 * @param {string} content - 文件内容
 * @param {string} sectionHeader - 区块标题
 * @returns {string} 区块内容
 */
function extractSection(content, sectionHeader) {
  const lines = content.split('\n');
  const startIdx = lines.findIndex(line => line.startsWith(sectionHeader));
  
  if (startIdx === -1) return '';
  
  let endIdx = startIdx + 1;
  while (endIdx < lines.length && !lines[endIdx].startsWith('## ')) {
    endIdx++;
  }
  
  return lines.slice(startIdx, endIdx).join('\n');
}

/**
 * 计算内容hash
 * @param {string} content - 文件内容
 * @returns {string} hash值
 */
function getContentHash(content) {
  // 简单hash（基于内容长度和首字符）
  return `${content.length}_${content.slice(0, 100).replace(/\s+/g, '_')}`;
}

/**
 * 获取创建提示消息
 * @returns {string}
 */
function getCreateMessage() {
  return `
[MANDATORY] 创建 ${TODO_FILE}

你已执行多次工具调用但未创建任务追踪文件。

请立即创建 ${TODO_FILE}，包含：
1. Current Task - 当前任务描述
2. Checklist - 分步骤清单（可勾选）
3. Progress - 进度记录（时间、工具调用、文件修改）
4. Notes - 重要决策和发现

示例：
# Task Tracking

## Current Task
实现用户登录功能

## Checklist
- [x] 创建登录页面UI
- [ ] 实现表单验证
- [ ] 集成后端API
- [ ] 测试登录流程

## Progress
- Started: 2026-04-17T12:00:00Z
- Tool calls: 10
- Files modified: 3
- 创建了login.html (12:05)

## Notes
- 使用JWT认证
- 表单验证需要邮箱格式检查
`;
}

/**
 * 获取更新提示消息
 * @returns {string}
 */
function getUpdateMessage() {
  return `
[CHECK] 更新 ${TODO_FILE}

这是周期性检查点，请更新进度：

1. 更新 Checklist - 完成的项目标记 [x]
2. 更新 Progress - 记录最新进度
3. 添加 Notes - 重要决策和发现

确保文件内容真实反映当前进度。
`;
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check') {
    const workspace = args[1] || process.cwd();
    const toolCallCount = parseInt(args[2]) || 0;
    
    const result = checkTaskTracking(workspace, toolCallCount);
    console.log(JSON.stringify(result, null, 2));
    
  } else if (command === 'create') {
    const workspace = args[1] || process.cwd();
    const task = args[2];
    
    const result = createTodo(workspace, task);
    console.log(JSON.stringify(result, null, 2));
    console.log(`\n✅ ${TODO_FILE}已创建: ${result.path}`);
    
  } else if (command === 'update') {
    const workspace = args[1] || process.cwd();
    
    const result = updateTodo(workspace);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.changed) {
      console.log(`\n✅ ${TODO_FILE}已更新`);
    } else {
      console.log(`\n⚠️ ${TODO_FILE}未变化`);
    }
    
  } else if (command === 'test') {
    // 测试创建触发
    const result1 = checkTaskTracking(process.cwd(), 4);
    console.log('创建触发测试:', result1.action === 'create' ? '✅' : '❌');
    
    // 测试更新触发
    fs.writeFileSync(path.join(process.cwd(), TODO_FILE), '# Task Tracking\n', 'utf8');
    const result2 = checkTaskTracking(process.cwd(), 12);
    console.log('更新触发测试:', result2.action === 'update' ? '✅' : '❌');
    
    // 清理测试文件
    fs.unlinkSync(path.join(process.cwd(), TODO_FILE));
    
    // 测试内容hash
    const hash1 = getContentHash('test content 1');
    const hash2 = getContentHash('test content 2');
    console.log('Hash变化检测:', hash1 !== hash2 ? '✅' : '❌');
    
  } else {
    console.log(`
Task Tracking - 任务追踪

用法:
  node task-tracking.js check <workspace> <tool_call_count>  检查状态
  node task-tracking.js create <workspace> [task]            创建Todo
  node task-tracking.js update <workspace>                    更新Todo
  node task-tracking.js test                                  运行测试

触发条件:
  第4次工具调用 → 强制创建 ${TODO_FILE}
  每12次工具调用 → 检查更新
`);
  }
}

// 导出函数
module.exports = {
  checkTaskTracking,
  createTodo,
  updateTodo,
  extractSection,
  getContentHash,
  getCreateMessage,
  getUpdateMessage,
  CREATE_THRESHOLD,
  UPDATE_THRESHOLD,
  TODO_FILE
};

// CLI入口
if (require.main === module) {
  main();
}