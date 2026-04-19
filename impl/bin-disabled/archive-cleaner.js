/**
 * Archive 文件清理器
 * 清理过期的 transcript archive 文件
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const TRANSCRIPT_DIR = path.join(os.homedir(), '.openclaw', 'transcripts');
const MAX_AGE_DAYS = 7;  // 保留 7 天
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function getArchiveFiles() {
  if (!fs.existsSync(TRANSCRIPT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(TRANSCRIPT_DIR)
    .filter(f => f.includes('.archived.'))
    .map(f => {
      const filePath = path.join(TRANSCRIPT_DIR, f);
      const stat = fs.statSync(filePath);
      return {
        name: f,
        path: filePath,
        size: stat.size,
        mtime: stat.mtime
      };
    });

  return files;
}

function cleanupArchives() {
  const files = getArchiveFiles();
  const now = Date.now();
  let deletedCount = 0;
  let freedSpace = 0;

  for (const file of files) {
    const age = now - file.mtime.getTime();

    if (age > MAX_AGE_MS) {
      try {
        fs.unlinkSync(file.path);
        deletedCount++;
        freedSpace += file.size;
        console.log(`[Archive Cleaner] Deleted: ${file.name}`);
      } catch (e) {
        console.error(`[Archive Cleaner] Failed to delete ${file.name}:`, e.message);
      }
    }
  }

  const freedMB = (freedSpace / (1024 * 1024)).toFixed(2);

  if (deletedCount > 0) {
    console.log(`[Archive Cleaner] Total: ${deletedCount} files deleted, ${freedMB}MB freed`);
  } else {
    console.log('[Archive Cleaner] No old archives to clean');
  }

  return { deleted: deletedCount, freedMB };
}

function getStats() {
  const files = getArchiveFiles();
  const now = Date.now();

  let totalSize = 0;
  let oldCount = 0;

  for (const file of files) {
    totalSize += file.size;
    if (now - file.mtime.getTime() > MAX_AGE_MS) {
      oldCount++;
    }
  }

  return {
    archiveCount: files.length,
    oldArchives: oldCount,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    maxAgeDays: MAX_AGE_DAYS
  };
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'cleanup':
      cleanupArchives();
      break;
    case 'stats':
      console.log(getStats());
      break;
    default:
      console.log('Usage: node archive-cleaner.js [cleanup|stats]');
  }
}

module.exports = { cleanupArchives, getStats };
