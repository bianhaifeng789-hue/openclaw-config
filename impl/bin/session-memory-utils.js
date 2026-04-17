#!/usr/bin/env node
/**
 * Session Memory Utils - 基于 Claude Code sessionMemoryUtils.ts
 * 
 * 会话记忆管理：
 *   - 记忆提取阈值
 *   - 状态追踪
 *   - 同步等待
 * 
 * Usage:
 *   node session-memory-utils.js init
 *   node session-memory-utils.js mark-extraction
 *   node session-memory-utils.js wait
 *   node session-memory-utils.js config
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'session-memory');
const STATE_FILE = path.join(STATE_DIR, 'session-memory-state.json');

const EXTRACTION_WAIT_TIMEOUT_MS = 15000;
const EXTRACTION_STALE_THRESHOLD_MS = 60000;

const DEFAULT_SESSION_MEMORY_CONFIG = {
  minimumMessageTokensToInit: 10000,
  minimumTokensBetweenUpdate: 5000,
  toolCallsBetweenUpdates: 3
};

function loadSessionMemoryState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      lastSummarizedMessageId: null,
      extractionStartedAt: null,
      tokensAtLastExtraction: 0,
      sessionMemoryInitialized: false,
      config: DEFAULT_SESSION_MEMORY_CONFIG
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {
      lastSummarizedMessageId: null,
      extractionStartedAt: null,
      tokensAtLastExtraction: 0,
      sessionMemoryInitialized: false,
      config: DEFAULT_SESSION_MEMORY_CONFIG
    };
  }
}

function saveSessionMemoryState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getLastSummarizedMessageId() {
  const state = loadSessionMemoryState();
  return state.lastSummarizedMessageId;
}

function setLastSummarizedMessageId(messageId) {
  const state = loadSessionMemoryState();
  state.lastSummarizedMessageId = messageId;
  saveSessionMemoryState(state);
  
  return {
    set: true,
    messageId
  };
}

function markExtractionStarted() {
  const state = loadSessionMemoryState();
  state.extractionStartedAt = Date.now();
  saveSessionMemoryState(state);
  
  return {
    marked: true,
    extractionStartedAt: state.extractionStartedAt
  };
}

function markExtractionCompleted() {
  const state = loadSessionMemoryState();
  state.extractionStartedAt = null;
  state.sessionMemoryInitialized = true;
  saveSessionMemoryState(state);
  
  return {
    marked: true,
    completedAt: Date.now()
  };
}

function isExtractionInProgress() {
  const state = loadSessionMemoryState();
  
  if (!state.extractionStartedAt) {
    return { inProgress: false };
  }
  
  const extractionAge = Date.now() - state.extractionStartedAt;
  
  if (extractionAge > EXTRACTION_STALE_THRESHOLD_MS) {
    return {
      inProgress: false,
      stale: true,
      extractionAgeMs: extractionAge
    };
  }
  
  return {
    inProgress: true,
    extractionStartedAt: state.extractionStartedAt,
    extractionAgeMs: extractionAge
  };
}

function shouldInitSessionMemory(currentTokens) {
  const state = loadSessionMemoryState();
  
  if (state.sessionMemoryInitialized) {
    return {
      shouldInit: false,
      reason: 'already initialized'
    };
  }
  
  if (currentTokens >= state.config.minimumMessageTokensToInit) {
    return {
      shouldInit: true,
      currentTokens,
      threshold: state.config.minimumMessageTokensToInit
    };
  }
  
  return {
    shouldInit: false,
    currentTokens,
    threshold: state.config.minimumMessageTokensToInit,
    reason: 'tokens below threshold'
  };
}

function shouldUpdateSessionMemory(currentTokens, toolCallCount) {
  const state = loadSessionMemoryState();
  
  if (!state.sessionMemoryInitialized) {
    return {
      shouldUpdate: false,
      reason: 'not initialized'
    };
  }
  
  const tokensGrowth = currentTokens - state.tokensAtLastExtraction;
  
  if (tokensGrowth >= state.config.minimumTokensBetweenUpdate) {
    return {
      shouldUpdate: true,
      tokensGrowth,
      threshold: state.config.minimumTokensBetweenUpdate
    };
  }
  
  if (toolCallCount >= state.config.toolCallsBetweenUpdates) {
    return {
      shouldUpdate: true,
      toolCallCount,
      threshold: state.config.toolCallsBetweenUpdates
    };
  }
  
  return {
    shouldUpdate: false,
    tokensGrowth,
    toolCallCount,
    thresholds: state.config
  };
}

function recordTokensAtExtraction(tokens) {
  const state = loadSessionMemoryState();
  state.tokensAtLastExtraction = tokens;
  saveSessionMemoryState(state);
  
  return {
    recorded: true,
    tokens
  };
}

function getSessionMemoryConfig() {
  const state = loadSessionMemoryState();
  return state.config;
}

function setSessionMemoryConfig(config) {
  const state = loadSessionMemoryState();
  state.config = { ...DEFAULT_SESSION_MEMORY_CONFIG, ...config };
  saveSessionMemoryState(state);
  
  return {
    set: true,
    config: state.config
  };
}

function getSessionMemoryStatus() {
  const state = loadSessionMemoryState();
  
  return {
    initialized: state.sessionMemoryInitialized,
    lastSummarizedMessageId: state.lastSummarizedMessageId,
    tokensAtLastExtraction: state.tokensAtLastExtraction,
    extractionInProgress: isExtractionInProgress(),
    config: state.config
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'init':
      const initTokens = parseInt(args[1], 10) || 0;
      console.log(JSON.stringify(shouldInitSessionMemory(initTokens), null, 2));
      break;
    case 'mark-start':
      console.log(JSON.stringify(markExtractionStarted(), null, 2));
      break;
    case 'mark-complete':
      console.log(JSON.stringify(markExtractionCompleted(), null, 2));
      break;
    case 'wait':
      console.log(JSON.stringify(isExtractionInProgress(), null, 2));
      break;
    case 'update':
      const updateTokens = parseInt(args[1], 10) || 0;
      const updateToolCalls = parseInt(args[2], 10) || 0;
      console.log(JSON.stringify(shouldUpdateSessionMemory(updateTokens, updateToolCalls), null, 2));
      break;
    case 'config':
      const configAction = args[1];
      if (configAction === 'get') {
        console.log(JSON.stringify(getSessionMemoryConfig(), null, 2));
      } else if (configAction === 'set') {
        const minTokens = parseInt(args[2], 10) || 10000;
        const minGrowth = parseInt(args[3], 10) || 5000;
        const toolCalls = parseInt(args[4], 10) || 3;
        console.log(JSON.stringify(setSessionMemoryConfig({
          minimumMessageTokensToInit: minTokens,
          minimumTokensBetweenUpdate: minGrowth,
          toolCallsBetweenUpdates: toolCalls
        }), null, 2));
      } else {
        console.log(JSON.stringify(getSessionMemoryConfig(), null, 2));
      }
      break;
    case 'status':
      console.log(JSON.stringify(getSessionMemoryStatus(), null, 2));
      break;
    case 'record-tokens':
      const recordTokens = parseInt(args[1], 10) || 0;
      console.log(JSON.stringify(recordTokensAtExtraction(recordTokens), null, 2));
      break;
    default:
      console.log('Usage: node session-memory-utils.js [init|mark-start|mark-complete|wait|update|config|status|record-tokens]');
      process.exit(1);
  }
}

main();

module.exports = {
  getLastSummarizedMessageId,
  setLastSummarizedMessageId,
  markExtractionStarted,
  markExtractionCompleted,
  isExtractionInProgress,
  shouldInitSessionMemory,
  shouldUpdateSessionMemory,
  recordTokensAtExtraction,
  getSessionMemoryConfig,
  setSessionMemoryConfig,
  getSessionMemoryStatus,
  DEFAULT_SESSION_MEMORY_CONFIG
};