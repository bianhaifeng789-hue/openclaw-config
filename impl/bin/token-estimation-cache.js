#!/usr/bin/env node
/**
 * Token Estimation Cache - Token 估算缓存
 * 
 * 功能：
 * 1. 缓存 estimateTokens 结果
 * 2. 减少重复计算
 * 3. 提升 compaction 性能
 * 
 * 用法：
 *   node token-estimation-cache.js status
 *   node token-estimation-cache.js clear
 *   node token-estimation-cache.js stats
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  workspace: '/Users/mar2game/.openclaw/workspace',
  stateFile: 'state/token-estimation-cache.json',
  maxCacheSize: 10000,  // 最多缓存 10000 条
  ttlMs: 60 * 60 * 1000  // 1 小时过期
};

// Token 估算缓存类
class TokenEstimationCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0
    };
  }
  
  // 生成消息指纹
  getMessageFingerprint(message) {
    // 简化指纹：role + content 前 100 字符
    const content = typeof message.content === 'string' 
      ? message.content 
      : JSON.stringify(message.content);
    return `${message.role}:${content.slice(0, 100)}`;
  }
  
  // 获取缓存
  get(message) {
    const key = this.getMessageFingerprint(message);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // 检查过期
    if (Date.now() - entry.timestamp > CONFIG.ttlMs) {
      this.cache.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.tokens;
  }
  
  // 设置缓存
  set(message, tokens) {
    const key = this.getMessageFingerprint(message);
    
    // 淘汰最旧
    if (this.cache.size >= CONFIG.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
    
    this.cache.set(key, {
      tokens,
      timestamp: Date.now()
    });
  }
  
  // 清理过期
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > CONFIG.ttlMs) {
        this.cache.delete(key);
        this.stats.expirations++;
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  // 获取统计
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    return {
      size: this.cache.size,
      maxSize: CONFIG.maxCacheSize,
      hitRate: Math.round(hitRate * 100),
      ...this.stats
    };
  }
  
  // 导出
  export() {
    return {
      cache: Array.from(this.cache.entries()),
      stats: this.stats,
      exportedAt: Date.now()
    };
  }
  
  // 导入
  import(data) {
    if (data.cache) {
      this.cache = new Map(data.cache);
    }
    if (data.stats) {
      this.stats = data.stats;
    }
  }
  
  // 清空
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }
}

// 全局实例
const tokenCache = new TokenEstimationCache();

// 加载缓存
function loadCache() {
  const cachePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  if (fs.existsSync(cachePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      tokenCache.import(data);
      console.log(`已加载缓存: ${tokenCache.cache.size} 条`);
    } catch (e) {
      console.log(`加载缓存失败: ${e.message}`);
    }
  }
}

// 保存缓存
function saveCache() {
  const cachePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  const data = tokenCache.export();
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
}

// 显示状态
function showStatus() {
  console.log('=== Token 估算缓存状态 ===\n');
  
  const stats = tokenCache.getStats();
  
  console.log(`缓存大小: ${stats.size}/${stats.maxSize}`);
  console.log(`命中率: ${stats.hitRate}%`);
  console.log(`命中: ${stats.hits}`);
  console.log(`错失: ${stats.misses}`);
  console.log(`淘汰: ${stats.evictions}`);
  console.log(`过期: ${stats.expirations}`);
}

// 清理缓存
function cleanupCache() {
  console.log('=== 清理 Token 估算缓存 ===\n');
  
  const cleaned = tokenCache.cleanup();
  saveCache();
  
  console.log(`清理完成: ${cleaned} 条过期`);
  console.log(`当前缓存: ${tokenCache.cache.size} 条`);
}

// 清空缓存
function clearCache() {
  console.log('=== 清空 Token 估算缓存 ===\n');
  
  const cleared = tokenCache.clear();
  saveCache();
  
  console.log(`清空完成: ${cleared} 条`);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'status';
  
  loadCache();
  
  switch (action) {
    case 'status':
      showStatus();
      break;
      
    case 'cleanup':
      cleanupCache();
      break;
      
    case 'clear':
      clearCache();
      break;
      
    default:
      console.log('用法: node token-estimation-cache.js [status|cleanup|clear]');
  }
  
  saveCache();
}

main().catch(console.error);