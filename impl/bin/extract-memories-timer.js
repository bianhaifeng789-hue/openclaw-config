#!/usr/bin/env node
/**
 * Extract Memories Timer - 基于 Claude Code extractMemories.ts
 * 
 * 提取时机：
 *   - 每次完整查询循环结束时（模型产生最终响应且无 tool calls）
 *   - 使用 forked agent 执行
 *   - 写入 ~/.claude/projects/<path>/memory/ 或 OpenClaw memory/
 * 
 * Usage:
 *   node extract-memories-timer.js check
 *   node extract-memories-timer.js extract <sessionId>
 *   node extract-memories-timer.js status
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const STATE_DIR = path.join(WORKSPACE, 'state', 'extract-memories');
const LAST_EXTRACT_FILE = path.join(STATE_DIR, 'last-extract.json');

function getLastExtractTime() {
  if (!fs.existsSync(LAST_EXTRACT_FILE)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(LAST_EXTRACT_FILE, 'utf8'));
    return data.lastExtractTime || null;
  } catch {
    return null;
  }
}

function recordExtract(sessionId, memoriesExtracted) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  
  const data = {
    lastExtractTime: Date.now(),
    lastSessionId: sessionId,
    memoriesExtracted,
    extractCount: incrementExtractCount()
  };
  
  fs.writeFileSync(LAST_EXTRACT_FILE, JSON.stringify(data, null, 2));
}

function incrementExtractCount() {
  const prev = getExtractCount();
  return prev + 1;
}

function getExtractCount() {
  if (!fs.existsSync(LAST_EXTRACT_FILE)) {
    return 0;
  }
  try {
    const data = JSON.parse(fs.readFileSync(LAST_EXTRACT_FILE, 'utf8'));
    return data.extractCount || 0;
  } catch {
    return 0;
  }
}

function shouldExtract(sessionId) {
  const lastExtract = getLastExtractTime();
  const hoursSince = lastExtract ? (Date.now() - lastExtract) / (1000 * 60 * 60) : Infinity;
  
  // Default: extract every 2 hours or on new session
  const threshold = 2;
  
  return {
    shouldExtract: hoursSince >= threshold,
    hoursSince: hoursSince === Infinity ? 'never' : hoursSince.toFixed(2),
    threshold,
    lastExtract: lastExtract ? new Date(lastExtract).toISOString() : 'never',
    reason: hoursSince >= threshold ? 'time threshold passed' : 'within threshold'
  };
}

function getMemoryFiles() {
  if (!fs.existsSync(MEMORY_DIR)) {
    return [];
  }
  
  return fs.readdirSync(MEMORY_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const filePath = path.join(MEMORY_DIR, f);
      const stat = fs.statSync(filePath);
      return {
        name: f,
        size: stat.size,
        lines: fs.readFileSync(filePath, 'utf8').split('\n').length,
        mtime: stat.mtimeMs
      };
    });
}

function extractMemoriesFromSession(sessionId) {
  // Placeholder: in real implementation, would use forked agent
  // to analyze session transcript and extract memories
  
  const extracted = {
    sessionId,
    extractedAt: Date.now(),
    memories: [
      { type: 'decision', content: 'Placeholder memory' }
    ],
    stats: {
      messagesAnalyzed: 0,
      memoriesExtracted: 1
    }
  };
  
  recordExtract(sessionId, extracted.stats.memoriesExtracted);
  
  return extracted;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'check':
      const sessionId = args[1] || 'default';
      const checkResult = shouldExtract(sessionId);
      console.log(JSON.stringify(checkResult, null, 2));
      break;
    case 'extract':
      const extractSessionId = args[1];
      if (!extractSessionId) {
        console.log('Usage: node extract-memories-timer.js extract <sessionId>');
        process.exit(1);
      }
      const extractResult = extractMemoriesFromSession(extractSessionId);
      console.log(JSON.stringify(extractResult, null, 2));
      break;
    case 'status':
      const status = {
        lastExtract: getLastExtractTime() ? new Date(getLastExtractTime()).toISOString() : 'never',
        extractCount: getExtractCount(),
        memoryFiles: getMemoryFiles(),
        memoryDir: MEMORY_DIR
      };
      console.log(JSON.stringify(status, null, 2));
      break;
    default:
      console.log('Usage: node extract-memories-timer.js [check|extract|status]');
      process.exit(1);
  }
}

main();