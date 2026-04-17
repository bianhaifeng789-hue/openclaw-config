#!/usr/bin/env node
/**
 * Sleep Tool - 基于 Claude Code SleepTool
 * 
 * 等待工具：
 *   - 延迟执行
 *   - 定时等待
 *   - 阻塞/非阻塞模式
 * 
 * Usage:
 *   node sleep-tool.js wait <milliseconds>
 *   node sleep-tool.js until <timestamp>
 *   node sleep-tool.js interval <ms> <count>
 */

const SLEEP_TOOL_NAME = 'Sleep';

function sleepSync(ms) {
  // Blocking sleep
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Busy wait (not recommended for long sleeps)
  }
  
  return {
    slept: true,
    durationMs: ms,
    actualDurationMs: Date.now() - start,
    startTimestamp: start,
    endTimestamp: Date.now()
  };
}

function sleepAsync(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        slept: true,
        durationMs: ms,
        startTimestamp: Date.now() - ms,
        endTimestamp: Date.now()
      });
    }, ms);
  });
}

function sleepUntil(targetTimestamp) {
  const now = Date.now();
  const waitMs = targetTimestamp - now;
  
  if (waitMs <= 0) {
    return {
      slept: false,
      reason: 'target time already passed',
      targetTimestamp,
      currentTimestamp: now
    };
  }
  
  return sleepAsync(waitMs);
}

function sleepInterval(ms, count, callback = null) {
  return new Promise(resolve => {
    const results = [];
    let iteration = 0;
    
    const interval = setInterval(() => {
      iteration++;
      
      const result = {
        iteration,
        timestamp: Date.now(),
        elapsedMs: iteration * ms
      };
      
      results.push(result);
      
      // Execute callback if provided
      if (callback) {
        callback(iteration, result);
      }
      
      if (iteration >= count) {
        clearInterval(interval);
        resolve({
          completed: true,
          count,
          intervalMs: ms,
          totalDurationMs: count * ms,
          results
        });
      }
    }, ms);
  });
}

function sleepWithProgress(ms, progressInterval = 1000) {
  return new Promise(resolve => {
    const start = Date.now();
    const results = [];
    
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = ms - elapsed;
      const progress = elapsed / ms;
      
      results.push({
        elapsedMs: elapsed,
        remainingMs: Math.max(0, remaining),
        progress: progress.toFixed(2),
        timestamp: Date.now()
      });
      
      if (remaining <= 0) {
        clearInterval(progressTimer);
        resolve({
          slept: true,
          durationMs: ms,
          progressUpdates: results
        });
      }
    }, progressInterval);
  });
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s (${ms}ms)`;
  }
}

function getSleepStats() {
  // Placeholder - would track sleep usage in real implementation
  return {
    totalSleeps: 0,
    totalDurationMs: 0,
    avgDurationMs: 0,
    longestSleepMs: 0
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'wait';
  
  switch (command) {
    case 'wait':
      const waitMs = parseInt(args[1], 10) || 1000;
      if (args.includes('--async')) {
        sleepAsync(waitMs).then(result => {
          console.log(JSON.stringify(result, null, 2));
        });
      } else {
        console.log(JSON.stringify(sleepSync(waitMs), null, 2));
      }
      break;
    case 'until':
      const targetTs = parseInt(args[1], 10);
      if (!targetTs) {
        console.log('Usage: node sleep-tool.js until <timestamp>');
        process.exit(1);
      }
      sleepUntil(targetTs).then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
      break;
    case 'interval':
      const intervalMs = parseInt(args[1], 10) || 1000;
      const count = parseInt(args[2], 10) || 5;
      sleepInterval(intervalMs, count, (i, r) => {
        console.log(`Iteration ${i}: ${r.elapsedMs}ms elapsed`);
      }).then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
      break;
    case 'progress':
      const progressMs = parseInt(args[1], 10) || 10000;
      const progressInterval = parseInt(args[2], 10) || 1000;
      sleepWithProgress(progressMs, progressInterval).then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
      break;
    case 'format':
      const formatMs = parseInt(args[1], 10) || 5000;
      console.log(JSON.stringify({
        milliseconds: formatMs,
        formatted: formatDuration(formatMs)
      }, null, 2));
      break;
    default:
      console.log('Usage: node sleep-tool.js [wait|until|interval|progress|format]');
      process.exit(1);
  }
}

main();

module.exports = {
  sleepSync,
  sleepAsync,
  sleepUntil,
  sleepInterval,
  sleepWithProgress,
  formatDuration,
  SLEEP_TOOL_NAME
};