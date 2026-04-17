#!/usr/bin/env node
/**
 * Session Memory Compact - 基于 Claude Code sessionMemoryCompact.ts
 * 
 * 会话记忆压缩配置：
 *   - minTokens: 10000 (最小保留 tokens)
 *   - minTextBlockMessages: 5 (最小保留文本消息数)
 *   - maxTokens: 40000 (最大保留 tokens 硬上限)
 * 
 * 目标：
 *   - 在保留关键信息的前提下压缩会话记忆
 *   - 适用于需要将 session memory 注入 prompt 的场景
 * 
 * Usage:
 *   node session-memory-compact.js get-config
 *   node session-memory-compact.js set-config <minTokens> <maxTokens>
 *   node session-memory-compact.js compact <sessionMemoryPath>
 *   node session-memory-compact.js estimate-tokens <content>
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const CONFIG_DIR = path.join(WORKSPACE, 'state', 'session-memory');

// Default config
const DEFAULT_SM_COMPACT_CONFIG = {
  minTokens: 10_000,
  minTextBlockMessages: 5,
  maxTokens: 40_000
};

let config = { ...DEFAULT_SM_COMPACT_CONFIG };

function getSessionMemoryCompactConfig() {
  const configFile = path.join(CONFIG_DIR, 'compact-config.json');
  if (fs.existsSync(configFile)) {
    try {
      const loaded = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      config = { ...DEFAULT_SM_COMPACT_CONFIG, ...loaded };
    } catch {
      // Use defaults
    }
  }
  return { ...config };
}

function setSessionMemoryCompactConfig(newConfig) {
  config = { ...config, ...newConfig };
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(CONFIG_DIR, 'compact-config.json'),
    JSON.stringify(config, null, 2)
  );
  return config;
}

function estimateTokens(content) {
  if (!content) return 0;
  
  if (typeof content === 'string') {
    // CJK: ~1 token per char, English: ~4 chars per token
    const cjkChars = (content.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    const englishChars = content.length - cjkChars;
    return Math.ceil(cjkChars + englishChars / 4);
  }
  
  if (Array.isArray(content)) {
    return content.reduce((sum, block) => {
      if (block.text) return sum + estimateTokens(block.text);
      if (block.content) return sum + estimateTokens(block.content);
      return sum + 50; // overhead
    }, 0);
  }
  
  return 0;
}

function getSessionMemoryContent(sessionMemoryPath) {
  if (!fs.existsSync(sessionMemoryPath)) {
    return { exists: false, path: sessionMemoryPath };
  }
  
  try {
    const content = fs.readFileSync(sessionMemoryPath, 'utf8');
    const tokens = estimateTokens(content);
    
    return {
      exists: true,
      path: sessionMemoryPath,
      content,
      tokens,
      lines: content.split('\n').length,
      needsCompact: tokens > config.maxTokens
    };
  } catch (error) {
    return { exists: false, path: sessionMemoryPath, error: error.message };
  }
}

function truncateSessionMemoryForCompact(content, targetTokens) {
  const cfg = getSessionMemoryCompactConfig();
  const actualTarget = Math.min(targetTokens || cfg.maxTokens, cfg.maxTokens);
  const currentTokens = estimateTokens(content);
  
  if (currentTokens <= actualTarget) {
    return {
      truncated: false,
      reason: 'within threshold',
      originalTokens: currentTokens,
      targetTokens: actualTarget
    };
  }
  
  // Simple truncation: keep first N lines until target met
  const lines = content.split('\n');
  const truncatedLines = [];
  let accumulatedTokens = 0;
  
  // Always keep header (first 5 lines)
  for (let i = 0; i < 5 && i < lines.length; i++) {
    truncatedLines.push(lines[i]);
    accumulatedTokens += estimateTokens(lines[i]);
  }
  
  // Keep content lines until target reached
  let i = 5;
  while (i < lines.length && accumulatedTokens < actualTarget) {
    const lineTokens = estimateTokens(lines[i]);
    if (accumulatedTokens + lineTokens <= actualTarget) {
      truncatedLines.push(lines[i]);
      accumulatedTokens += lineTokens;
    }
    i++;
  }
  
  const truncatedContent = truncatedLines.join('\n');
  
  return {
    truncated: true,
    originalTokens: currentTokens,
    truncatedTokens: accumulatedTokens,
    targetTokens: actualTarget,
    linesRemoved: lines.length - truncatedLines.length,
    truncatedContent
  };
}

function compactSessionMemory(sessionMemoryPath) {
  const cfg = getSessionMemoryCompactConfig();
  const memory = getSessionMemoryContent(sessionMemoryPath);
  
  if (!memory.exists) {
    return { success: false, reason: 'memory not found', path: sessionMemoryPath };
  }
  
  const result = truncateSessionMemoryForCompact(memory.content, cfg.maxTokens);
  
  if (result.truncated) {
    // Save truncated version
    const backupPath = sessionMemoryPath + '.backup';
    fs.writeFileSync(backupPath, memory.content);
    fs.writeFileSync(sessionMemoryPath, result.truncatedContent);
    
    return {
      success: true,
      path: sessionMemoryPath,
      backupPath,
      ...result
    };
  }
  
  return {
    success: true,
    path: sessionMemoryPath,
    ...result
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'get-config';
  
  switch (command) {
    case 'get-config':
      console.log(JSON.stringify(getSessionMemoryCompactConfig(), null, 2));
      break;
    case 'set-config':
      const minTokens = parseInt(args[1], 10) || 10000;
      const maxTokens = parseInt(args[2], 10) || 40000;
      console.log(JSON.stringify(setSessionMemoryCompactConfig({
        minTokens,
        maxTokens
      }), null, 2));
      break;
    case 'compact':
      const memoryPath = args[1];
      if (!memoryPath) {
        console.log('Usage: node session-memory-compact.js compact <sessionMemoryPath>');
        process.exit(1);
      }
      console.log(JSON.stringify(compactSessionMemory(memoryPath), null, 2));
      break;
    case 'estimate-tokens':
      const content = args[1] || '';
      console.log(JSON.stringify({
        tokens: estimateTokens(content),
        chars: content.length
      }, null, 2));
      break;
    case 'check':
      const checkPath = args[1] || path.join(WORKSPACE, 'MEMORY.md');
      console.log(JSON.stringify(getSessionMemoryContent(checkPath), null, 2));
      break;
    default:
      console.log('Usage: node session-memory-compact.js [get-config|set-config|compact|estimate-tokens|check]');
      process.exit(1);
  }
}

main();

module.exports = {
  getSessionMemoryCompactConfig,
  setSessionMemoryCompactConfig,
  estimateTokens,
  getSessionMemoryContent,
  truncateSessionMemoryForCompact,
  compactSessionMemory
};