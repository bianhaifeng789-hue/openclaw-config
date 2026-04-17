#!/usr/bin/env node
/**
 * Post Compact Cleanup - 基于 Claude Code postCompactCleanup.ts
 * 
 * 压缩后清理：
 *   - resetMicrocompactState
 *   - clearSystemPromptSections
 *   - clearClassifierApprovals
 *   - clearSpeculativeChecks
 *   - resetGetMemoryFilesCache
 *   - clearSessionMessagesCache
 *   - clearBetaTracingState
 * 
 * 注意：不清理 invoked_skills，让 skill 内容跨压缩保持
 * 
 * Usage:
 *   node post-compact-cleanup.js run [querySource]
 *   node post-compact-cleanup.js status
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state');
const CACHE_DIR = path.join(STATE_DIR, 'caches');

// Cleanup state tracker
const cleanupState = {
  lastCleanup: null,
  cleanupCount: 0,
  cachesCleared: []
};

function clearCache(cacheName) {
  const cachePath = path.join(CACHE_DIR, cacheName);
  if (fs.existsSync(cachePath)) {
    try {
      fs.rmSync(cachePath, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }
  return true; // Already clear
}

function clearSessionMessagesCache() {
  return clearCache('session-messages');
}

function clearClassifierApprovals() {
  return clearCache('classifier-approvals');
}

function clearSpeculativeChecks() {
  return clearCache('speculative-checks');
}

function clearSystemPromptSections() {
  return clearCache('system-prompt-sections');
}

function resetGetMemoryFilesCache(reason) {
  const memoryCache = path.join(STATE_DIR, 'memory-config', 'memory-files-cache.json');
  if (fs.existsSync(memoryCache)) {
    try {
      fs.unlinkSync(memoryCache);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

function resetMicrocompactState() {
  const microCache = path.join(STATE_DIR, 'microcompact-state.json');
  if (fs.existsSync(microCache)) {
    try {
      fs.unlinkSync(microCache);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

function clearBetaTracingState() {
  return clearCache('beta-tracing');
}

function getUserContextCacheClear() {
  const userContextCache = path.join(STATE_DIR, 'user-context-cache.json');
  if (fs.existsSync(userContextCache)) {
    try {
      fs.unlinkSync(userContextCache);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

function runPostCompactCleanup(querySource) {
  // Determine if main thread compact
  const isMainThreadCompact = 
    querySource === undefined ||
    querySource.startsWith('repl_main_thread') ||
    querySource === 'sdk';
  
  const results = {
    querySource: querySource || 'undefined',
    isMainThreadCompact,
    cachesCleared: [],
    errors: [],
    timestamp: Date.now()
  };
  
  // Run all cleanup functions
  const cleanupFunctions = [
    { name: 'resetMicrocompactState', fn: resetMicrocompactState },
    { name: 'clearSystemPromptSections', fn: clearSystemPromptSections },
    { name: 'clearClassifierApprovals', fn: clearClassifierApprovals },
    { name: 'clearSpeculativeChecks', fn: clearSpeculativeChecks },
    { name: 'clearBetaTracingState', fn: clearBetaTracingState },
    { name: 'clearSessionMessagesCache', fn: clearSessionMessagesCache }
  ];
  
  // Main thread only
  if (isMainThreadCompact) {
    cleanupFunctions.push(
      { name: 'getUserContextCacheClear', fn: getUserContextCacheClear },
      { name: 'resetGetMemoryFilesCache', fn: () => resetGetMemoryFilesCache('compact') }
    );
  }
  
  for (const { name, fn } of cleanupFunctions) {
    try {
      const success = fn();
      results.cachesCleared.push({ name, success });
      if (success) {
        cleanupState.cachesCleared.push(name);
      }
    } catch (error) {
      results.errors.push({ name, error: error.message });
    }
  }
  
  // Update cleanup state
  cleanupState.lastCleanup = Date.now();
  cleanupState.cleanupCount++;
  
  // Persist cleanup state
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STATE_DIR, 'compact-cleanup-state.json'),
    JSON.stringify(cleanupState, null, 2)
  );
  
  results.cleanupCount = cleanupState.cleanupCount;
  
  return results;
}

function getCleanupStatus() {
  return {
    ...cleanupState,
    cachesDir: CACHE_DIR,
    existingCaches: fs.existsSync(CACHE_DIR) 
      ? fs.readdirSync(CACHE_DIR) 
      : []
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'run':
      const querySource = args[1];
      const result = runPostCompactCleanup(querySource);
      console.log(JSON.stringify(result, null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getCleanupStatus(), null, 2));
      break;
    default:
      console.log('Usage: node post-compact-cleanup.js [run|status] [querySource]');
      process.exit(1);
  }
}

main();

module.exports = { runPostCompactCleanup, getCleanupStatus };