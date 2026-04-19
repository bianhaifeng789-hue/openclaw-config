/**
 * Bootstrap Cache LRU 管理器
 * 实现带过期策略的 LRU Cache
 */

class LRUCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;  // 最多缓存 100 个 session
    this.ttlMs = options.ttlMs || 30 * 60 * 1000;  // 30 分钟过期
    this.cache = new Map();
    this.lastAccess = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 检查过期
    const lastAccess = this.lastAccess.get(key);
    if (Date.now() - lastAccess > this.ttlMs) {
      this.delete(key);
      return null;
    }

    // LRU 更新：移到最新
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.lastAccess.set(key, Date.now());

    return entry;
  }

  set(key, value) {
    // 如果已存在，先删除再添加（移到最新）
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 淘汰最旧的
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.delete(oldest);
    }

    this.cache.set(key, value);
    this.lastAccess.set(key, Date.now());
  }

  delete(key) {
    this.cache.delete(key);
    this.lastAccess.delete(key);
  }

  // 清理过期条目
  cleanup() {
    const now = Date.now();
    const expired = [];
    for (const [key, time] of this.lastAccess) {
      if (now - time > this.ttlMs) {
        expired.push(key);
      }
    }
    for (const key of expired) {
      this.delete(key);
    }
    return expired.length;
  }

  // 获取统计信息
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
      lastAccessCount: this.lastAccess.size
    };
  }

  // 快照（用于状态保存）
  snapshot() {
    return {
      entries: Array.from(this.cache.entries()),
      lastAccess: Array.from(this.lastAccess.entries()),
      timestamp: Date.now()
    };
  }

  // 恢复（从状态恢复）
  restore(data) {
    if (!data || !data.entries) return;

    // 检查是否过期（超过 5 分钟不恢复）
    if (Date.now() - data.timestamp > 5 * 60 * 1000) {
      return;
    }

    this.cache = new Map(data.entries);
    this.lastAccess = new Map(data.lastAccess);
  }
}

// 全局实例
const bootstrapCache = new LRUCache({
  maxSize: 100,
  ttlMs: 30 * 60 * 1000
});

const contextCache = new LRUCache({
  maxSize: 50,
  ttlMs: 60 * 60 * 1000  // 1 小时
});

// 定期清理
function startCleanupTimer() {
  setInterval(() => {
    const bootCleaned = bootstrapCache.cleanup();
    const ctxCleaned = contextCache.cleanup();
    if (bootCleaned > 0 || ctxCleaned > 0) {
      console.log(`[Cache Cleanup] Bootstrap: ${bootCleaned}, Context: ${ctxCleaned}`);
    }
  }, 5 * 60 * 1000);  // 每 5 分钟
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'stats':
      console.log('Bootstrap Cache:', bootstrapCache.stats());
      console.log('Context Cache:', contextCache.stats());
      break;
    case 'cleanup':
      const bootCleaned = bootstrapCache.cleanup();
      const ctxCleaned = contextCache.cleanup();
      console.log(`Cleaned: Bootstrap=${bootCleaned}, Context=${ctxCleaned}`);
      break;
    default:
      console.log('Usage: node cache-lru-manager.js [stats|cleanup]');
  }
}

module.exports = { LRUCache, bootstrapCache, contextCache, startCleanupTimer };
