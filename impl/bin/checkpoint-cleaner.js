/**
 * Checkpoint 自动清理器
 * 清理过期的 compaction checkpoint
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE_FILE = path.join(os.homedir(), '.openclaw', 'session-store.json');
const MAX_CHECKPOINTS = 25;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;  // 7 天

function loadSessionStore() {
  if (!fs.existsSync(STORE_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to load session store:', e.message);
    return {};
  }
}

function saveSessionStore(store) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
    return true;
  } catch (e) {
    console.error('Failed to save session store:', e.message);
    return false;
  }
}

function trimCheckpoints(checkpoints) {
  if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
    return checkpoints;
  }

  const now = Date.now();

  // 先按年龄过滤
  const fresh = checkpoints.filter(c => {
    const age = now - (c.createdAt || c.timestamp || 0);
    return age < MAX_AGE_MS;
  });

  // 再按数量限制
  return fresh.slice(-MAX_CHECKPOINTS);
}

function cleanupCheckpoints() {
  const store = loadSessionStore();
  let totalCleaned = 0;
  let sessionsAffected = 0;

  for (const [key, entry] of Object.entries(store)) {
    if (!entry?.compactionCheckpoints) continue;

    const originalCount = entry.compactionCheckpoints.length;
    const trimmed = trimCheckpoints(entry.compactionCheckpoints);

    if (trimmed.length !== originalCount) {
      entry.compactionCheckpoints = trimmed;
      totalCleaned += originalCount - trimmed.length;
      sessionsAffected++;
    }
  }

  if (totalCleaned > 0) {
    saveSessionStore(store);
    console.log(`[Checkpoint Cleanup] Cleaned ${totalCleaned} checkpoints from ${sessionsAffected} sessions`);
  } else {
    console.log('[Checkpoint Cleanup] No old checkpoints to clean');
  }

  return { cleaned: totalCleaned, sessions: sessionsAffected };
}

function getStats() {
  const store = loadSessionStore();
  let totalCheckpoints = 0;
  let sessionCount = 0;

  for (const [key, entry] of Object.entries(store)) {
    if (entry?.compactionCheckpoints?.length > 0) {
      totalCheckpoints += entry.compactionCheckpoints.length;
      sessionCount++;
    }
  }

  return {
    totalCheckpoints,
    sessionsWithCheckpoints: sessionCount,
    maxCheckpoints: MAX_CHECKPOINTS,
    maxAgeDays: 7
  };
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'cleanup':
      cleanupCheckpoints();
      break;
    case 'stats':
      console.log(getStats());
      break;
    default:
      console.log('Usage: node checkpoint-cleaner.js [cleanup|stats]');
  }
}

module.exports = { cleanupCheckpoints, getStats, trimCheckpoints };
