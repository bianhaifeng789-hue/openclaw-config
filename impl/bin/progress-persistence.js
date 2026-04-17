#!/usr/bin/env node
/**
 * Progress Persistence - Context Reset 进度持久化
 * 
 * 解决 Context Reset 后 Agent 丢失进度的问题：
 * - 持久化 checkpoint 到 progress.md
 * - 注入 git diff context
 * - 恢复时读取 progress.md + 最近代码变更
 * 
 * 来源：Harness Engineering - context.py create_checkpoint/restore_from_checkpoint
 * 
 * 用法：
 * node progress-persistence.js create <workspace> <messages_json>
 * node progress-persistence.js restore <workspace> <system_prompt>
 * node progress-persistence.js check <workspace>
 * node progress-persistence.js status
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROGRESS_FILE = 'progress.md';
const MAX_GIT_CONTEXT = 2000;
const MAX_CHECKPOINT_SIZE = 5000;

/**
 * 创建 checkpoint 并持久化到 progress.md
 * @param {string} workspace - 工作目录
 * @param {string} checkpointContent - checkpoint 内容（已由 LLM 生成）
 * @returns {Object} 结果
 */
function createCheckpoint(workspace, checkpointContent) {
  if (!workspace || !fs.existsSync(workspace)) {
    return { success: false, error: 'Workspace not found' };
  }
  
  // Truncate if too large
  if (checkpointContent.length > MAX_CHECKPOINT_SIZE) {
    checkpointContent = checkpointContent.slice(0, MAX_CHECKPOINT_SIZE) + '\n...[truncated]';
  }
  
  const progressPath = path.join(workspace, PROGRESS_FILE);
  
  try {
    // Add timestamp header
    const timestamp = new Date().toISOString();
    const fullContent = `# Progress Checkpoint
Created: ${timestamp}

${checkpointContent}
`;
    
    fs.writeFileSync(progressPath, fullContent, 'utf8');
    
    return {
      success: true,
      path: progressPath,
      size: fullContent.length,
      timestamp
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 从 checkpoint 恢复，注入 git diff context
 * @param {string} workspace - 工作目录
 * @param {string} systemPrompt - 系统提示
 * @returns {Object} 结果（包含 fresh messages）
 */
function restoreFromCheckpoint(workspace, systemPrompt) {
  if (!workspace || !fs.existsSync(workspace)) {
    return { success: false, error: 'Workspace not found' };
  }
  
  const progressPath = path.join(workspace, PROGRESS_FILE);
  
  // Read progress.md
  let checkpoint = '';
  if (fs.existsSync(progressPath)) {
    try {
      checkpoint = fs.readFileSync(progressPath, 'utf8');
      // Remove timestamp header
      checkpoint = checkpoint.replace(/^# Progress Checkpoint\nCreated: [^\n]+\n\n/, '');
    } catch (err) {
      return { success: false, error: `Failed to read progress.md: ${err.message}` };
    }
  } else {
    return { success: false, error: 'progress.md not found - cannot restore' };
  }
  
  // Get git diff context
  let gitContext = '';
  try {
    // Try git diff first, fallback to git log
    let gitOutput = '';
    try {
      gitOutput = execSync(
        'git diff --stat HEAD~5 2>/dev/null',
        { cwd: workspace, encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
    } catch (diffErr) {
      // Fallback to git log
      gitOutput = execSync(
        'git log --oneline -5 2>/dev/null',
        { cwd: workspace, encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }
    
    if (gitOutput && gitOutput.trim()) {
      gitContext = `\n\nRecent code changes:\n\`\`\`\n${gitOutput.trim().slice(0, MAX_GIT_CONTEXT)}\n\`\`\``;
    }
  } catch (gitErr) {
    // Git not available or not a git repo - skip git context
  }
  
  // Build fresh messages
  const freshMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `You are resuming an in-progress project. Your previous session's context was reset to give you a clean slate.

Here is the handoff document from the previous session:

${checkpoint}${gitContext}

Continue from where the previous session left off. Do NOT redo work that's already completed.` }
  ];
  
  return {
    success: true,
    messages: freshMessages,
    checkpointSize: checkpoint.length,
    hasGitContext: gitContext.length > 0,
    gitContextSize: gitContext.length
  };
}

/**
 * 检查 progress.md 是否存在
 * @param {string} workspace - 工作目录
 * @returns {Object} 状态
 */
function checkProgress(workspace) {
  if (!workspace || !fs.existsSync(workspace)) {
    return { exists: false, error: 'Workspace not found' };
  }
  
  const progressPath = path.join(workspace, PROGRESS_FILE);
  
  if (!fs.existsSync(progressPath)) {
    return { exists: false, path: progressPath };
  }
  
  try {
    const content = fs.readFileSync(progressPath, 'utf8');
    const stat = fs.statSync(progressPath);
    
    // Extract timestamp
    const timestampMatch = content.match(/^Created: ([^\n]+)/);
    const timestamp = timestampMatch ? timestampMatch[1] : null;
    
    return {
      exists: true,
      path: progressPath,
      size: stat.size,
      timestamp,
      lines: content.split('\n').length
    };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'create') {
    const workspace = args[1];
    const checkpointContent = args[2];
    
    if (!workspace || !checkpointContent) {
      console.error('用法: node progress-persistence.js create <workspace> <checkpoint_content>');
      process.exit(1);
    }
    
    // If checkpoint is a file path, read it
    let content = checkpointContent;
    if (fs.existsSync(checkpointContent)) {
      content = fs.readFileSync(checkpointContent, 'utf8');
    }
    
    const result = createCheckpoint(workspace, content);
    console.log(JSON.stringify(result, null, 2));
    
  } else if (command === 'restore') {
    const workspace = args[1];
    const systemPrompt = args[2] || 'You are a helpful assistant.';
    
    if (!workspace) {
      console.error('用法: node progress-persistence.js restore <workspace> [system_prompt]');
      process.exit(1);
    }
    
    const result = restoreFromCheckpoint(workspace, systemPrompt);
    console.log(JSON.stringify(result, null, 2));
    
  } else if (command === 'check') {
    const workspace = args[1];
    
    if (!workspace) {
      console.error('用法: node progress-persistence.js check <workspace>');
      process.exit(1);
    }
    
    const result = checkProgress(workspace);
    console.log(JSON.stringify(result, null, 2));
    
  } else if (command === 'status') {
    console.log(JSON.stringify({
      version: '1.0.0',
      progressFile: PROGRESS_FILE,
      maxCheckpointSize: MAX_CHECKPOINT_SIZE,
      maxGitContext: MAX_GIT_CONTEXT,
      source: 'Harness Engineering - context.py'
    }, null, 2));
    
  } else {
    console.error('用法:');
    console.error('  node progress-persistence.js create <workspace> <checkpoint_content>');
    console.error('  node progress-persistence.js restore <workspace> [system_prompt]');
    console.error('  node progress-persistence.js check <workspace>');
    console.error('  node progress-persistence.js status');
    process.exit(1);
  }
}

// Export for module usage
module.exports = {
  createCheckpoint,
  restoreFromCheckpoint,
  checkProgress,
  PROGRESS_FILE,
  MAX_CHECKPOINT_SIZE,
  MAX_GIT_CONTEXT
};

// Run CLI if called directly
if (require.main === module) {
  main();
}