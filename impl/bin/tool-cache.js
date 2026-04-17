#!/usr/bin/env node
/**
 * Tool Result Cache - Reduce repeated API calls
 *
 * Purpose: Cache tool results to avoid repeated calls
 *
 * Strategy:
 * - File read: Cache for 5 minutes
 * - Search results: Cache for 10 minutes
 * - Command output: Cache for 1 minute (short-lived)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');
const CACHE_DIR = path.join(WORKSPACE, 'state', 'tool-cache');

// Cache TTL (minutes)
const TTL = {
  'read': 5,
  'glob': 10,
  'grep': 10,
  'exec': 1,
  'web_fetch': 30,
  'default': 5
};

class ToolCache {
  constructor() {
    this.cacheDir = CACHE_DIR;
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0
    };
  }

  /**
   * Generate cache key from tool call
   */
  hashKey(toolName, params) {
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    const hash = crypto.createHash('sha256').update(`${toolName}:${sortedParams}`).digest('hex').slice(0, 16);
    return `${toolName}-${hash}.json`;
  }

  /**
   * Get cached result if valid
   */
  get(toolName, params) {
    const key = this.hashKey(toolName, params);
    const cachePath = path.join(this.cacheDir, key);

    if (!fs.existsSync(cachePath)) {
      this.stats.misses++;
      return null;
    }

    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      const ttlMinutes = TTL[toolName] || TTL.default;
      const age = (Date.now() - cached.timestamp) / 60000;

      if (age > ttlMinutes) {
        // Cache expired
        fs.unlinkSync(cachePath);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      cached.fromCache = true;
      return cached.result;
    } catch {
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Save result to cache
   */
  set(toolName, params, result) {
    const key = this.hashKey(toolName, params);
    const cachePath = path.join(this.cacheDir, key);

    const cached = {
      toolName,
      params,
      result,
      timestamp: Date.now()
    };

    fs.writeFileSync(cachePath, JSON.stringify(cached, null, 2));
    this.stats.saves++;
  }

  /**
   * Clear expired cache
   */
  clearExpired() {
    const files = fs.readdirSync(this.cacheDir);
    let cleared = 0;

    for (const file of files) {
      const filePath = path.join(this.cacheDir, file);
      try {
        const cached = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const toolName = cached.toolName;
        const ttlMinutes = TTL[toolName] || TTL.default;
        const age = (Date.now() - cached.timestamp) / 60000;

        if (age > ttlMinutes) {
          fs.unlinkSync(filePath);
          cleared++;
        }
      } catch {
        // Invalid cache file, remove
        fs.unlinkSync(filePath);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get stats
   */
  getStats() {
    const files = fs.readdirSync(this.cacheDir);
    return {
      ...this.stats,
      totalFiles: files.length,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const cache = new ToolCache();

switch (command) {
  case 'get':
    const toolName = args[1];
    const paramsJson = args[2] || '{}';
    const params = JSON.parse(paramsJson);
    const result = cache.get(toolName, params);
    console.log(JSON.stringify({ cached: result !== null, result }, null, 2));
    break;

  case 'set':
    const setToolName = args[1];
    const setParamsJson = args[2] || '{}';
    const setResultJson = args[3] || '{}';
    const setParams = JSON.parse(setParamsJson);
    const setResult = JSON.parse(setResultJson);
    cache.set(setToolName, setParams, setResult);
    console.log(JSON.stringify({ saved: true }, null, 2));
    break;

  case 'clear':
    const cleared = cache.clearExpired();
    console.log(JSON.stringify({ cleared }, null, 2));
    break;

  case 'stats':
    console.log(JSON.stringify(cache.getStats(), null, 2));
    break;

  case 'test':
    // Test cache
    cache.set('read', { path: '/test/file.txt' }, { content: 'Hello World' });
    const cached = cache.get('read', { path: '/test/file.txt' });
    console.log('Cache test:', cached ? '✅ Hit' : '❌ Miss');
    console.log(JSON.stringify(cache.getStats(), null, 2));
    break;

  default:
    console.log('Usage: tool-cache.js [get|set|clear|stats|test]');
    console.log('');
    console.log('Commands:');
    console.log('  get <toolName> <paramsJson> - Get cached result');
    console.log('  set <toolName> <paramsJson> <resultJson> - Save result');
    console.log('  clear - Clear expired cache');
    console.log('  stats - Get cache stats');
    console.log('  test - Test cache');
}

module.exports = { ToolCache, TTL };