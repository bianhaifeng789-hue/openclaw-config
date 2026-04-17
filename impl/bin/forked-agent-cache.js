#!/usr/bin/env node
/**
 * Forked Agent Cache Sharing - 基于 Claude Code forkSubagent.ts
 * 
 * Forked agent 模式：
 *   - 父会话 fork 出子 agent
 *   - 子 agent 共享父会话的 prompt cache
 *   - 减少重复 token 消耗
 * 
 * Cache Safe Params:
 *   - assistant_message: 包含 tool_use blocks（触发 cache hit）
 *   - system: 系统提示词（保持一致）
 *   - messages: 用户消息历史（共享 cache）
 * 
 * Usage:
 *   node forked-agent-cache.js create <parentSessionId>
 *   node forked-agent-cache.js check <childSessionId>
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const CACHE_DIR = path.join(WORKSPACE, 'state', 'prompt-cache');

function getCacheKey(sessionId) {
  return crypto.createHash('sha256').update(sessionId).digest('hex').slice(0, 16);
}

function createCacheSafeParams(parentSessionId, messages, system) {
  const cacheKey = getCacheKey(parentSessionId);
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
  
  // Create cache entry
  const cacheEntry = {
    sessionId: parentSessionId,
    cacheKey,
    createdAt: Date.now(),
    system,
    messages: messages.slice(0, -1), // All but last message (shared)
    lastMessage: messages[messages.length - 1], // The triggering message
    stats: {
      totalMessages: messages.length,
      cachedMessages: messages.length - 1,
      estimatedTokensSaved: estimateTokensSaved(messages.length - 1)
    }
  };
  
  // Save cache
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(cacheEntry, null, 2));
  
  return {
    cacheKey,
    cacheFile,
    cacheSafeParams: {
      assistant_message: {
        role: 'assistant',
        content: messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || []
      },
      system,
      messages: messages.slice(0, -1)
    },
    stats: cacheEntry.stats
  };
}

function getCacheForChild(parentSessionId) {
  const cacheKey = getCacheKey(parentSessionId);
  const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
  
  if (!fs.existsSync(cacheFile)) {
    return null;
  }
  
  try {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch {
    return null;
  }
}

function estimateTokensSaved(messageCount) {
  // Rough estimate: each cached message saves ~500 tokens
  return messageCount * 500;
}

function checkCacheHit(childSessionId, parentSessionId) {
  const parentCache = getCacheForChild(parentSessionId);
  
  if (!parentCache) {
    return {
      hit: false,
      reason: 'parent cache not found'
    };
  }
  
  const cacheAge = Date.now() - parentCache.createdAt;
  const cacheAgeHours = cacheAge / (1000 * 60 * 60);
  
  // Cache expires after 24 hours (ephemeral cache TTL)
  if (cacheAgeHours > 24) {
    return {
      hit: false,
      reason: 'cache expired',
      cacheAgeHours: cacheAgeHours.toFixed(2)
    };
  }
  
  return {
    hit: true,
    parentSessionId,
    childSessionId,
    cacheKey: parentCache.cacheKey,
    stats: parentCache.stats,
    cacheAgeHours: cacheAgeHours.toFixed(2),
    recommendation: 'Use cacheSafeParams in API call to trigger cache hit'
  };
}

function listCaches() {
  if (!fs.existsSync(CACHE_DIR)) {
    return [];
  }
  
  const caches = fs.readdirSync(CACHE_DIR).filter(f => f.endsWith('.json'));
  
  return caches.map(cacheFile => {
    try {
      const cache = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, cacheFile), 'utf8'));
      return {
        cacheKey: cache.cacheKey,
        sessionId: cache.sessionId,
        createdAt: new Date(cache.createdAt).toISOString(),
        ageHours: ((Date.now() - cache.createdAt) / (1000 * 60 * 60)).toFixed(2),
        messages: cache.stats.totalMessages,
        tokensSaved: cache.stats.estimatedTokensSaved
      };
    } catch {
      return null;
    }
  }).filter(c => c !== null);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'create':
      const parentId = args[1];
      if (!parentId) {
        console.log('Usage: node forked-agent-cache.js create <parentSessionId>');
        process.exit(1);
      }
      // In real use, messages and system would come from session state
      const result = createCacheSafeParams(parentId, [], '');
      console.log(JSON.stringify(result, null, 2));
      break;
    case 'check':
      const childId = args[1];
      const parentIdCheck = args[2];
      if (!childId || !parentIdCheck) {
        console.log('Usage: node forked-agent-cache.js check <childSessionId> <parentSessionId>');
        process.exit(1);
      }
      const checkResult = checkCacheHit(childId, parentIdCheck);
      console.log(JSON.stringify(checkResult, null, 2));
      break;
    case 'list':
      const caches = listCaches();
      console.log(JSON.stringify({ caches, count: caches.length }, null, 2));
      break;
    case 'clear':
      if (fs.existsSync(CACHE_DIR)) {
        fs.rmSync(CACHE_DIR, { recursive: true });
        console.log('Cache cleared');
      } else {
        console.log('No cache to clear');
      }
      break;
    default:
      console.log('Usage: node forked-agent-cache.js [create|check|list|clear]');
      process.exit(1);
  }
}

main();