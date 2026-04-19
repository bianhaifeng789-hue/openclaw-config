/**
 * Session Write Lock 优化配置
 * 优化 lock 参数，减少卡顿和堆积
 */

// 原始配置
const ORIGINAL_CONFIG = {
  staleMs: 1800 * 1000,           // 30 分钟
  maxHoldMs: 300 * 1000,          // 5 分钟
  watchdogIntervalMs: 60 * 1000   // 60 秒
};

// 优化配置
const OPTIMIZED_CONFIG = {
  staleMs: 900 * 1000,            // 15 分钟（更快检测 stale）
  maxHoldMs: 180 * 1000,          // 3 分钟（更快释放）
  watchdogIntervalMs: 30 * 1000   // 30 秒（更快检查）
};

// 长任务配置（需要显式延长）
const LONG_TASK_CONFIG = {
  staleMs: 1800 * 1000,           // 30 分钟
  maxHoldMs: 600 * 1000,          // 10 分钟
  watchdogIntervalMs: 30 * 1000   // 30 秒
};

function getConfig(taskType = 'default') {
  switch (taskType) {
    case 'long':
      return LONG_TASK_CONFIG;
    case 'optimized':
      return OPTIMIZED_CONFIG;
    default:
      return ORIGINAL_CONFIG;
  }
}

// 生成配置代码
function generateConfigCode(config) {
  return `
// Session Write Lock 配置（优化后）
const DEFAULT_STALE_MS = ${config.staleMs};           // ${config.staleMs / 1000} 秒
const DEFAULT_MAX_HOLD_MS = ${config.maxHoldMs};      // ${config.maxHoldMs / 1000} 秒
const DEFAULT_WATCHDOG_INTERVAL_MS = ${config.watchdogIntervalMs};  // ${config.watchdogIntervalMs / 1000} 秒
`;
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'original':
      console.log('Original config:');
      console.log(generateConfigCode(ORIGINAL_CONFIG));
      break;

    case 'optimized':
      console.log('Optimized config:');
      console.log(generateConfigCode(OPTIMIZED_CONFIG));
      break;

    case 'long':
      console.log('Long task config:');
      console.log(generateConfigCode(LONG_TASK_CONFIG));
      break;

    case 'compare':
      console.log('Config comparison:');
      console.log('');
      console.log('Parameter          | Original | Optimized | Improvement');
      console.log('-------------------|----------|-----------|------------');
      console.log(`Stale Ms           | ${ORIGINAL_CONFIG.staleMs/1000}s     | ${OPTIMIZED_CONFIG.staleMs/1000}s       | 2x faster`);
      console.log(`Max Hold Ms        | ${ORIGINAL_CONFIG.maxHoldMs/1000}s      | ${OPTIMIZED_CONFIG.maxHoldMs/1000}s        | 1.7x faster`);
      console.log(`Watchdog Interval  | ${ORIGINAL_CONFIG.watchdogIntervalMs/1000}s      | ${OPTIMIZED_CONFIG.watchdogIntervalMs/1000}s        | 2x faster`);
      break;

    default:
      console.log('Usage: node session-lock-config.js [original|optimized|long|compare]');
  }
}

module.exports = {
  ORIGINAL_CONFIG,
  OPTIMIZED_CONFIG,
  LONG_TASK_CONFIG,
  getConfig,
  generateConfigCode
};
